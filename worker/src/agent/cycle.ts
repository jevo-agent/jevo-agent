import { randomUUID } from "node:crypto";
import type {
  AgentCycleKind,
  AgentCycleRecord,
  AgentCycleStatus,
  JevDecisionRecord,
  RankSnapshot,
} from "@jevo/protocol-types";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  agentCycles,
  assets,
  jevDecisions,
  marketSnapshots,
  memoryEvents,
  opportunityScores,
  protocolEvents,
  signalObservations,
} from "../db/schema";
import { createDecisionEngine, type DecisionEngine } from "../jev";
import { logger } from "../observability/logger";
import { evaluatePairingStub } from "../pairing";
import { createProvidersRegistry, type ProvidersRegistry } from "../providers";
import {
  computeMarketMomentum,
  computeSocialVelocity,
  rankCycle,
  type AssetToRank,
  type CycleRankingSummary,
} from "../ranking";

export interface CycleExecutionOptions {
  forcedCycleId?: string;
  previousCycleId?: string | null;
  providersRegistry?: ProvidersRegistry;
  decisionEngine?: DecisionEngine;
  simulateCrashAtStep?: number;
}

export interface CycleExecutionResult {
  cycleId: string;
  kind: AgentCycleKind;
  status: AgentCycleStatus | "SKIPPED";
  reason?: string;
  assetsScanned: number;
  signalsProcessed: number;
  rankingSummary?: CycleRankingSummary;
  durationMs: number;
}

/**
 * TX1: Mints the cycle row inside agent_cycles protected by a Postgres transaction advisory lock.
 * If the advisory lock cannot be acquired or another cycle of this kind is running, returns null.
 */
export async function mintCycle(
  cycleKind: AgentCycleKind,
  options?: { forcedCycleId?: string; client?: typeof db },
): Promise<string | null> {
  const client = options?.client ?? db;
  const cycleId =
    options?.forcedCycleId ?? `cycle-${cycleKind.toLowerCase()}-${Date.now()}`;

  return await client.transaction(async (tx) => {
    // 1. Acquire transaction-level advisory lock keyed by cycle kind
    const lockKey = `JEVO_CYCLE_${cycleKind.toUpperCase()}`;
    const result = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(hashtext(${lockKey})) AS acquired`,
    );
    const lockRow = (result as any).rows?.[0];

    if (!lockRow?.acquired) {
      logger.warn(
        { cycleKind },
        "Advisory lock held by another worker. Skipping cycle mint.",
      );
      return null;
    }

    // 2. Check if this exact cycle ID already exists
    const [existingWithId] = await tx
      .select()
      .from(agentCycles)
      .where(eq(agentCycles.id, cycleId))
      .limit(1);

    if (existingWithId) {
      if (existingWithId.status === "COMPLETED") {
        logger.info(
          { cycleId },
          "Cycle has already completed successfully. Skipping re-execution.",
        );
        return null;
      }
      logger.info(
        { cycleId, status: existingWithId.status },
        "Resuming uncompleted cycle execution...",
      );
      return existingWithId.id;
    }

    // 3. Double check if any other cycle of this kind is currently running
    const [existingRunning] = await tx
      .select({ id: agentCycles.id })
      .from(agentCycles)
      .where(
        and(
          eq(agentCycles.kind, cycleKind),
          eq(agentCycles.status, "RUNNING"),
        ),
      )
      .limit(1);

    if (existingRunning) {
      logger.warn(
        { cycleKind, activeCycleId: existingRunning.id },
        "A cycle of this kind is already running. Skipping.",
      );
      return null;
    }

    // 4. Insert into agent_cycles (status = 'RUNNING')
    await tx.insert(agentCycles).values({
      id: cycleId,
      kind: cycleKind,
      startedAt: new Date(),
      status: "RUNNING",
      assetsScanned: 0,
      signalsProcessed: 0,
    });

    logger.info({ cycleId, cycleKind }, "TX1: Cycle formally minted");
    return cycleId;
  });
}

/**
 * BACKEND 05 — Full 16-step Agent Cycle Orchestration.
 * Executes the complete agent pipeline following Section 9 of BackendHandoff.md:
 *
 *  1. Mint cycle_id — Postgres advisory lock + INSERT INTO agent_cycles (TX1)
 *  2. Acquire current universe — SELECT * FROM assets WHERE active
 *  3. Collect provider observations — wrapped + logged to provider_runs
 *  4. Normalize features — deterministic normalizers (market momentum + social velocity)
 *  5. Diff against previous cycle's opportunity_scores
 *  6. Detect meaningful deltas
 *  7. Request Jev evaluation — DecisionEngine.decideForAsset() + qualitative scores
 *  8. Calculate opportunity scores — deterministic arithmetic
 *  9. Rank assets — order by score desc
 * 10. Calculate rank deltas — compare to prior rank_history row
 * 11. Identify pairing candidates — threshold trigger (stub)
 * 12. Evaluate pairing theses — PairingEngine.evaluate() (stub)
 * 13. Persist — upsert decisions, scores, rank_history (TX2)
 * 14. Write memory events — TX4
 * 15. Publish protocol events — protocol_events table write
 * 16. Mark agent_cycles.status='COMPLETED' (TX5)
 */
export async function executeAgentCycle(
  cycleKind: AgentCycleKind,
  options: CycleExecutionOptions = {},
): Promise<CycleExecutionResult> {
  const startTime = Date.now();

  // Step 1: Mint cycle_id (TX1)
  const cycleId = await mintCycle(cycleKind, {
    forcedCycleId: options.forcedCycleId,
  });

  if (!cycleId) {
    return {
      cycleId: options.forcedCycleId ?? "unminted",
      kind: cycleKind,
      status: "SKIPPED",
      reason: "COULD_NOT_ACQUIRE_LOCK_OR_ALREADY_RUNNING",
      assetsScanned: 0,
      signalsProcessed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Publish AGENT_SCAN_STARTED (Section 12 Event)
  await db.insert(protocolEvents).values({
    eventId: `evt-scan-started-${cycleId}-${randomUUID().slice(0, 8)}`,
    eventType: "AGENT_SCAN_STARTED",
    cycleId,
    subjectType: "cycle",
    subjectId: cycleId,
    payload: { cycleId, kind: cycleKind },
    schemaVersion: 1,
    actor: "JEVO_AGENT",
    createdAt: new Date(),
  });

  const cycleLogger = logger.child({ cycleId, cycleKind });

  try {
    // Step 2: Acquire current universe
    const activeAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.active, true));

    cycleLogger.info(
      { activeAssetsCount: activeAssets.length },
      "Step 2: Acquired active assets universe",
    );

    if (activeAssets.length === 0) {
      cycleLogger.warn("Active universe is empty. Completing cycle early.");
      await db
        .update(agentCycles)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
          assetsScanned: 0,
          signalsProcessed: 0,
        })
        .where(eq(agentCycles.id, cycleId));

      return {
        cycleId,
        kind: cycleKind,
        status: "COMPLETED",
        assetsScanned: 0,
        signalsProcessed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // Initialize dependencies
    const providers =
      options.providersRegistry ?? createProvidersRegistry("mock");
    const decisionEngine =
      options.decisionEngine ?? createDecisionEngine("mock");

    // Step 5: Diff against previous cycle's opportunity_scores per symbol
    let priorCycleId = options.previousCycleId;
    if (priorCycleId === undefined) {
      const [latestCompleted] = await db
        .select({ id: agentCycles.id })
        .from(agentCycles)
        .where(
          and(
            ne(agentCycles.id, cycleId),
            eq(agentCycles.status, "COMPLETED"),
          ),
        )
        .orderBy(desc(agentCycles.startedAt))
        .limit(1);
      priorCycleId = latestCompleted?.id ?? null;
    }

    const priorScoresMap = new Map<
      string,
      { score: number; marketMomentum: number; socialVelocity: number }
    >();
    if (priorCycleId) {
      const priorScores = await db
        .select()
        .from(opportunityScores)
        .where(eq(opportunityScores.cycleId, priorCycleId));
      for (const ps of priorScores) {
        priorScoresMap.set(ps.symbol, {
          score: ps.score,
          marketMomentum: ps.marketMomentum,
          socialVelocity: ps.socialVelocity,
        });
      }
    }

    // Step 3: Collect provider observations
    cycleLogger.info("Step 3: Collecting provider observations...");
    let signalsProcessedCount = 0;
    const sinceTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const assetsToRank: AssetToRank[] = [];

    for (const asset of activeAssets) {
      try {
        // Collect Market Snapshot
        const marketSnapshot = await providers.marketData.getSnapshot(
          asset.symbol,
        );
        await db
          .insert(marketSnapshots)
          .values({
            id: marketSnapshot.id,
            symbol: asset.symbol,
            price: marketSnapshot.price,
            volume24h: marketSnapshot.volume24h,
            volatility: marketSnapshot.volatility,
            capturedAt: new Date(marketSnapshot.capturedAt),
            source: marketSnapshot.source,
          })
          .onConflictDoNothing();
        signalsProcessedCount++;

        // Collect Stock Token Canonical Address & Onchain Price
        const canonicalAddr = await providers.stockToken.getCanonicalAddress(
          asset.symbol,
        );
        if (canonicalAddr) {
          await providers.stockToken.getOnchainPrice(canonicalAddr);
          signalsProcessedCount++;
        }

        // Collect Narrative Signals
        const narrativeSignals = await providers.narrative.getSignals(
          asset.symbol,
          sinceTimestamp,
        );
        for (const sig of narrativeSignals) {
          await db
            .insert(signalObservations)
            .values({
              id: sig.id,
              symbol: asset.symbol,
              kind: sig.kind,
              magnitude: sig.magnitude,
              label: sig.label,
              capturedAt: new Date(sig.capturedAt),
              source: sig.source,
            })
            .onConflictDoNothing();
          signalsProcessedCount++;
        }

        // Collect Social Velocity Signals
        const socialSignals = await providers.social.getVelocity(
          asset.symbol,
          sinceTimestamp,
        );
        for (const sig of socialSignals) {
          await db
            .insert(signalObservations)
            .values({
              id: sig.id,
              symbol: asset.symbol,
              kind: sig.kind,
              magnitude: sig.magnitude,
              label: sig.label,
              capturedAt: new Date(sig.capturedAt),
              source: sig.source,
            })
            .onConflictDoNothing();
          signalsProcessedCount++;
        }

        // Step 4: Normalize features (deterministic)
        const marketMomentum = computeMarketMomentum({
          current: marketSnapshot,
        });
        const socialVelocity = computeSocialVelocity({
          observations: socialSignals,
        });

        // Publish ASSET_ANALYZED (Section 12 Event)
        await db.insert(protocolEvents).values({
          eventId: `evt-analyzed-${cycleId}-${asset.symbol}-${randomUUID().slice(0, 8)}`,
          eventType: "ASSET_ANALYZED",
          cycleId,
          subjectType: "asset",
          subjectId: asset.symbol,
          payload: {
            symbol: asset.symbol,
            marketMomentum,
            socialVelocity,
          },
          schemaVersion: 1,
          actor: "JEVO_AGENT",
          createdAt: new Date(),
        });

        // Step 6: Detect meaningful deltas (Skip gate to control LLM cost / rate limits)
        const prior = priorScoresMap.get(asset.symbol);
        const hasPrior = prior !== undefined;
        // Check delta against prior cycle; threshold is strict (skip if literally identical or difference <= 0.001)
        const deltaMarket = hasPrior ? Math.abs(marketMomentum - prior.marketMomentum) : 100;
        const deltaSocial = hasPrior ? Math.abs(socialVelocity - prior.socialVelocity) : 100;
        const hasMeaningfulDelta = !hasPrior || deltaMarket > 0.001 || deltaSocial > 0.001;

        let jevScores = {
          narrativeMomentum: 75,
          culturalRelevance: 75,
          memeCompatibility: 75,
          cryptoAdjacency: 75,
          pairCompatibility: 75,
        };

        if (hasMeaningfulDelta) {
          // Step 7: Request Jev evaluation ONLY for symbols with meaningful changes
          const decisionRecord = await decisionEngine.decideForAsset(cycleId, asset.symbol, {
            marketMomentum,
            socialVelocity,
          });

          const rawQualitative =
            await decisionEngine.evaluateQualitativeScores(asset.symbol, {
              marketMomentum,
              socialVelocity,
            });

          jevScores = {
            narrativeMomentum: rawQualitative.narrativeMomentum ?? 75,
            culturalRelevance: rawQualitative.culturalRelevance ?? 75,
            memeCompatibility: rawQualitative.memeCompatibility ?? 75,
            cryptoAdjacency: rawQualitative.cryptoAdjacency ?? 75,
            pairCompatibility: rawQualitative.pairCompatibility ?? 75,
          };

          // Publish JEV_DECISION_COMPLETED (Section 12 Event)
          await db.insert(protocolEvents).values({
            eventId: `evt-jev-decision-${cycleId}-${asset.symbol}-${randomUUID().slice(0, 8)}`,
            eventType: "JEV_DECISION_COMPLETED",
            cycleId,
            subjectType: "asset",
            subjectId: asset.symbol,
            payload: {
              symbol: asset.symbol,
              decision: decisionRecord.decision,
              confidence: decisionRecord.confidence,
              signals: decisionRecord.signals,
            },
            schemaVersion: 1,
            actor: "JEVO_AGENT",
            createdAt: new Date(),
          });

          // Publish ASSET_PROMOTED / ASSET_DEMOTED (Section 12 Event)
          if (decisionRecord.decision === "PROMOTE" || decisionRecord.decision === "DEMOTE") {
            await db.insert(protocolEvents).values({
              eventId: `evt-decision-action-${cycleId}-${asset.symbol}-${randomUUID().slice(0, 8)}`,
              eventType: decisionRecord.decision === "PROMOTE" ? "ASSET_PROMOTED" : "ASSET_DEMOTED",
              cycleId,
              subjectType: "asset",
              subjectId: asset.symbol,
              payload: {
                symbol: asset.symbol,
                decision: decisionRecord.decision,
                confidence: decisionRecord.confidence,
              },
              schemaVersion: 1,
              actor: "JEVO_AGENT",
              createdAt: new Date(),
            });
          }
        } else {
          // Gate skip: carry forward prior evaluation to avoid redundant Jev LLM calls
          cycleLogger.info(
            { symbol: asset.symbol },
            "Step 6 Gate: No material change detected. Skipping Jev evaluation and carrying forward prior judgment.",
          );

          await decisionEngine.decideForAsset(cycleId, asset.symbol, {
            marketMomentum,
            socialVelocity,
            skippedReason: "NO_MATERIAL_DELTA",
          });
        }

        assetsToRank.push({
          symbol: asset.symbol,
          components: {
            marketMomentum,
            socialVelocity,
            ...jevScores,
          },
        });
      } catch (err) {
        // Section 16: Partial provider failure is skipped and logged, cycle continues
        cycleLogger.error(
          { symbol: asset.symbol, err },
          "Partial provider failure for asset. Skipping symbol this cycle.",
        );
      }
    }

    // Simulated crash injection for testing crash-recovery
    if (options.simulateCrashAtStep === 8) {
      throw new Error("Simulated failure at Step 8");
    }

    // Step 5, 8, 9, 10, 13 (TX2): Rank Assets, Compute Opportunity Scores, and Persist
    cycleLogger.info(
      { scoredAssetsCount: assetsToRank.length },
      "Step 8-13: Ranking cycle and persisting scores...",
    );

    const rankingSummary = await rankCycle({
      cycleId,
      previousCycleId: options.previousCycleId,
      assets: assetsToRank,
    });

    // Step 11 & 12 (TX3): Pairing Candidates & Theses (Stub for BACKEND 06)
    await evaluatePairingStub();

    // Step 14 (TX4): Write memory events for top / promoted assets
    const topAsset = rankingSummary.rankedAssets[0];
    if (topAsset) {
      await db.insert(memoryEvents).values({
        id: `mem-${cycleId}-${topAsset.symbol}-${randomUUID().slice(0, 8)}`,
        subjectType: "ASSET",
        subjectId: topAsset.symbol,
        cycleId,
        previousState: { rank: topAsset.previousRank },
        observedChange: `Asset ${topAsset.symbol} ranked #0${topAsset.currentRank} with opportunity score ${topAsset.opportunityScore}`,
        decision: topAsset.currentRank === 1 ? "PROMOTE" : "HOLD",
        currentState: {
          rank: topAsset.currentRank,
          score: topAsset.opportunityScore,
        },
        evidenceRefs: [`cycle:${cycleId}`, `asset:${topAsset.symbol}`],
        recordedAt: new Date(),
      });
    }

    // Step 15: Publish protocol events
    await db.insert(protocolEvents).values([
      {
        eventId: `evt-ranking-${cycleId}-${randomUUID().slice(0, 8)}`,
        eventType: "RANKING_UPDATED",
        cycleId,
        subjectType: "RANKING",
        subjectId: cycleId,
        payload: {
          cycleId,
          topSymbol: topAsset?.symbol,
          topScore: topAsset?.opportunityScore,
          rankedCount: rankingSummary.rankedAssets.length,
        },
        schemaVersion: 1,
        actor: "JEVO_AGENT",
        createdAt: new Date(),
      },
      {
        eventId: `evt-cycle-${cycleId}-${randomUUID().slice(0, 8)}`,
        eventType: "CYCLE_COMPLETED",
        cycleId,
        subjectType: "CYCLE",
        subjectId: cycleId,
        payload: {
          cycleId,
          kind: cycleKind,
          assetsScanned: activeAssets.length,
          signalsProcessed: signalsProcessedCount,
        },
        schemaVersion: 1,
        actor: "JEVO_AGENT",
        createdAt: new Date(),
      },
    ]);

    // Step 16 (TX5): Mark cycle COMPLETED
    await db
      .update(agentCycles)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        assetsScanned: activeAssets.length,
        signalsProcessed: signalsProcessedCount,
      })
      .where(eq(agentCycles.id, cycleId));

    cycleLogger.info(
      {
        durationMs: Date.now() - startTime,
        assetsScanned: activeAssets.length,
        signalsProcessed: signalsProcessedCount,
      },
      "Step 16: Agent cycle COMPLETED successfully",
    );

    return {
      cycleId,
      kind: cycleKind,
      status: "COMPLETED",
      assetsScanned: activeAssets.length,
      signalsProcessed: signalsProcessedCount,
      rankingSummary,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    cycleLogger.error(
      { err: error },
      "Agent cycle crashed. Marking status='FAILED'...",
    );

    // Crash recovery: Ensure cycle is marked FAILED, never left in RUNNING
    await db
      .update(agentCycles)
      .set({
        status: "FAILED",
        completedAt: new Date(),
      })
      .where(eq(agentCycles.id, cycleId));

    // Section 12 Event: CYCLE_FAILED
    try {
      await db.insert(protocolEvents).values({
        eventId: `evt-cycle-failed-${cycleId}-${randomUUID().slice(0, 8)}`,
        eventType: "CYCLE_FAILED",
        cycleId,
        subjectType: "cycle",
        subjectId: cycleId,
        payload: {
          cycleId,
          kind: cycleKind,
          error: (error as any)?.message ?? String(error),
        },
        schemaVersion: 1,
        actor: "JEVO_AGENT",
        createdAt: new Date(),
      });
    } catch (emitErr) {
      cycleLogger.error({ emitErr }, "Failed to emit CYCLE_FAILED protocol event");
    }

    throw error;
  }
}
