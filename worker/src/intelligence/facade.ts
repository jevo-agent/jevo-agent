import { desc, eq, inArray, and } from "drizzle-orm";
import { db } from "../db/client";
import {
  agentCycles,
  assets,
  jevDecisions,
  memoryEvents,
  opportunityScores,
  pairingCandidates,
  pairingDecisions,
  rankHistory,
} from "../db/schema";
import { env } from "../config/env";

export type IntelligenceEntity =
  | "stock"
  | "opportunity"
  | "pairing"
  | "decision"
  | "activity";

export interface ProviderModeInfo {
  providerMode: "mock" | "real";
  jevMode: "mock" | "real";
  marketDataMode: "mock" | "real";
  narrativeMode: "mock" | "real";
  stockTokenMode: "mock" | "real";
  /** Social input is intentionally fixture-backed until a real provider exists. */
  socialMode: "mock";
  isSimulated: boolean;
}

export interface ProviderModeSelection {
  providerMode: "mock" | "real";
  jevMode: "mock" | "real";
  marketDataMode: "mock" | "real";
  narrativeMode: "mock" | "real";
  stockTokenMode: "mock" | "real";
}

export interface CanonicalIntelligenceDTO {
  entity: IntelligenceEntity;
  id?: string;
  symbol?: string;
  name?: string;
  currentState?: Record<string, unknown>;
  decision?: string;
  score?: number;
  confidence?: number;
  factors?: Record<string, number>;
  evidenceRefs?: string[];
  cycleId?: string;
  source?: {
    providerMode: ProviderModeInfo;
    [key: string]: unknown;
  };
  model?: string;
  evaluatedAt?: string;
}

/**
 * Returns explicit runtime provider mode information.
 * Strictly guarantees that simulated/mock environments are never reported as "real".
 */
export function buildProviderModeInfo(
  modes: ProviderModeSelection,
): ProviderModeInfo {
  const socialMode = "mock" as const;
  const isSimulated =
    socialMode === "mock" ||
    modes.providerMode === "mock" ||
    modes.jevMode === "mock" ||
    modes.marketDataMode === "mock" ||
    modes.narrativeMode === "mock" ||
    modes.stockTokenMode === "mock";

  return {
    // This aggregate is deliberately conservative: any mocked input means
    // the runtime is simulated, even when other providers are real.
    providerMode: isSimulated ? "mock" : "real",
    jevMode: modes.jevMode,
    marketDataMode: modes.marketDataMode,
    narrativeMode: modes.narrativeMode,
    stockTokenMode: modes.stockTokenMode,
    socialMode,
    isSimulated,
  };
}

export function getProviderModeInfo(): ProviderModeInfo {
  return buildProviderModeInfo({
    providerMode: env.PROVIDER_MODE,
    jevMode: env.JEV_MODE,
    marketDataMode: env.MARKET_DATA_MODE,
    narrativeMode: env.NARRATIVE_MODE,
    stockTokenMode: env.STOCK_TOKEN_MODE,
  });
}

/**
 * Strips undefined or null keys from DTO to avoid presenting fake data.
 */
function cleanDto(obj: CanonicalIntelligenceDTO): CanonicalIntelligenceDTO {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          result[key] = value;
        }
      } else if (typeof value === "object" && Object.keys(value).length === 0) {
        // omit empty objects
      } else {
        result[key] = value;
      }
    }
  }
  return result as unknown as CanonicalIntelligenceDTO;
}

export class JevoIntelligenceFacade {
  /**
   * Retrieves full canonical intelligence state for a specific stock asset.
   */
  async getStockState(symbolInput: string): Promise<CanonicalIntelligenceDTO | null> {
    const symbol = symbolInput.toUpperCase().trim();

    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    if (!asset) {
      return null;
    }

    const [rank] = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.symbol, symbol))
      .orderBy(desc(rankHistory.recordedAt))
      .limit(1);

    const [oppScore] = rank?.cycleId
      ? await db
          .select()
          .from(opportunityScores)
          .where(and(eq(opportunityScores.symbol, symbol), eq(opportunityScores.cycleId, rank.cycleId)))
          .limit(1)
      : await db
          .select()
          .from(opportunityScores)
          .where(eq(opportunityScores.symbol, symbol))
          .limit(1);

    const [decision] = rank?.cycleId
      ? await db
          .select()
          .from(jevDecisions)
          .where(and(eq(jevDecisions.symbol, symbol), eq(jevDecisions.cycleId, rank.cycleId)))
          .limit(1)
      : await db
          .select()
          .from(jevDecisions)
          .where(eq(jevDecisions.symbol, symbol))
          .orderBy(desc(jevDecisions.createdAt))
          .limit(1);

    let factors: Record<string, number> | undefined;
    if (oppScore) {
      factors = {
        marketMomentum: oppScore.marketMomentum,
        narrativeMomentum: oppScore.narrativeMomentum,
        socialVelocity: oppScore.socialVelocity,
        culturalRelevance: oppScore.culturalRelevance,
        memeCompatibility: oppScore.memeCompatibility,
        cryptoAdjacency: oppScore.cryptoAdjacency,
        pairCompatibility: oppScore.pairCompatibility,
      };
    }

    const currentState: Record<string, unknown> = {
      active: asset.active,
      stockTokenAddress: asset.stockTokenAddress,
    };
    if (rank) {
      currentState.rank = rank.currentRank;
      if (rank.previousRank !== null && rank.previousRank !== undefined) {
        currentState.previousRank = rank.previousRank;
      }
    }

    return cleanDto({
      entity: "stock" as const,
      symbol: asset.symbol,
      name: asset.name,
      currentState,
      decision: decision?.decision,
      score: oppScore?.score ?? rank?.opportunityScore,
      confidence: decision?.confidence,
      factors,
      evidenceRefs: decision?.signals,
      cycleId: decision?.cycleId ?? rank?.cycleId,
      source: {
        providerMode: getProviderModeInfo(),
        dataSource: "onchain_registry",
      },
      model: decision?.modelVersion,
      evaluatedAt: decision?.createdAt?.toISOString() ?? rank?.recordedAt?.toISOString(),
    });
  }

  /**
   * Retrieves opportunities evaluated in the latest cycle.
   */
  async getOpportunities(options?: {
    limit?: number;
    sort?: "rank" | "score";
    decision?: string;
  }): Promise<CanonicalIntelligenceDTO[]> {
    const completedCycles = await db
      .select({ id: agentCycles.id })
      .from(agentCycles)
      .where(eq(agentCycles.status, "COMPLETED"))
      .orderBy(desc(agentCycles.startedAt))
      .limit(1);

    const targetCycleId =
      completedCycles[0]?.id ??
      (
        await db
          .select({ id: agentCycles.id })
          .from(agentCycles)
          .orderBy(desc(agentCycles.startedAt))
          .limit(1)
      )[0]?.id;

    if (!targetCycleId) {
      return [];
    }

    const ranks = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.cycleId, targetCycleId))
      .orderBy(rankHistory.currentRank);

    if (ranks.length === 0) {
      return [];
    }

    const symbols = ranks.map((r) => r.symbol);

    const [assetRows, scoreRows, decisionRows] = await Promise.all([
      db.select().from(assets).where(inArray(assets.symbol, symbols)),
      db
        .select()
        .from(opportunityScores)
        .where(
          and(
            inArray(opportunityScores.symbol, symbols),
            eq(opportunityScores.cycleId, targetCycleId),
          ),
        ),
      db
        .select()
        .from(jevDecisions)
        .where(
          and(
            inArray(jevDecisions.symbol, symbols),
            eq(jevDecisions.cycleId, targetCycleId),
          ),
        ),
    ]);

    const assetMap = new Map(assetRows.map((a) => [a.symbol, a]));
    const scoreMap = new Map(scoreRows.map((s) => [s.symbol, s]));
    const decisionMap = new Map(decisionRows.map((d) => [d.symbol, d]));

    let results: CanonicalIntelligenceDTO[] = ranks.map((rank) => {
      const asset = assetMap.get(rank.symbol);
      const scoreRow = scoreMap.get(rank.symbol);
      const decisionRow = decisionMap.get(rank.symbol);

      let factors: Record<string, number> | undefined;
      if (scoreRow) {
        factors = {
          marketMomentum: scoreRow.marketMomentum,
          narrativeMomentum: scoreRow.narrativeMomentum,
          socialVelocity: scoreRow.socialVelocity,
          culturalRelevance: scoreRow.culturalRelevance,
          memeCompatibility: scoreRow.memeCompatibility,
          cryptoAdjacency: scoreRow.cryptoAdjacency,
          pairCompatibility: scoreRow.pairCompatibility,
        };
      }

      const currentState: Record<string, unknown> = {
        rank: rank.currentRank,
      };
      if (rank.previousRank !== null && rank.previousRank !== undefined) {
        currentState.previousRank = rank.previousRank;
      }
      if (asset) {
        currentState.active = asset.active;
      }

      return cleanDto({
        entity: "opportunity" as const,
        symbol: rank.symbol,
        name: asset?.name,
        currentState,
        decision: decisionRow?.decision,
        score: scoreRow?.score ?? rank.opportunityScore,
        confidence: decisionRow?.confidence,
        factors,
        evidenceRefs: decisionRow?.signals,
        cycleId: rank.cycleId,
        source: {
          providerMode: getProviderModeInfo(),
        },
        model: decisionRow?.modelVersion,
        evaluatedAt: rank.recordedAt.toISOString(),
      });
    });

    if (options?.decision) {
      const targetDecision = options.decision.toUpperCase();
      results = results.filter((r) => r.decision?.toUpperCase() === targetDecision);
    }

    if (options?.sort === "score") {
      results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }

    if (options?.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Retrieves evaluated pairing candidates and their theses.
   */
  async getPairings(options?: {
    symbol?: string;
    limit?: number;
  }): Promise<CanonicalIntelligenceDTO[]> {
    let query = db.select().from(pairingCandidates);

    if (options?.symbol) {
      const sym = options.symbol.toUpperCase().trim();
      query = db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.symbol, sym)) as typeof query;
    }

    const rows = await query
      .orderBy(desc(pairingCandidates.createdAt))
      .limit(options?.limit ?? 50);

    if (rows.length === 0) {
      return [];
    }

    const candidateIds = rows.map((r) => r.id);
    const decisionRows = await db
      .select()
      .from(pairingDecisions)
      .where(inArray(pairingDecisions.pairingCandidateId, candidateIds))
      .orderBy(desc(pairingDecisions.createdAt));

    const decisionMap = new Map<string, (typeof decisionRows)[0]>();
    for (const d of decisionRows) {
      if (!decisionMap.has(d.pairingCandidateId)) {
        decisionMap.set(d.pairingCandidateId, d);
      }
    }

    return rows.map((candidate) => {
      const decisionRow = decisionMap.get(candidate.id);

      const factors: Record<string, number> | undefined = candidate.components
        ? (candidate.components as unknown as Record<string, number>)
        : undefined;

      return cleanDto({
        entity: "pairing" as const,
        id: candidate.id,
        symbol: candidate.symbol,
        name: `${candidate.symbol} / ${candidate.memeSymbol}`,
        currentState: {
          memeSymbol: candidate.memeSymbol,
          lifecycleState: candidate.lifecycleState,
        },
        decision: decisionRow?.decision,
        score: candidate.pairingScore,
        confidence: decisionRow?.confidence,
        factors,
        source: {
          providerMode: getProviderModeInfo(),
        },
        evaluatedAt: candidate.createdAt.toISOString(),
      });
    });
  }

  /**
   * Retrieves a specific Jev decision record by its ID or by symbol.
   */
  async getDecision(idOrSymbol: string): Promise<CanonicalIntelligenceDTO | null> {
    const trimmed = idOrSymbol.trim();

    // 1. Attempt lookup by primary key ID
    let [decisionRow] = await db
      .select()
      .from(jevDecisions)
      .where(eq(jevDecisions.id, trimmed))
      .limit(1);

    // 2. Fallback: lookup by symbol if ID not matched
    if (!decisionRow) {
      const upperSym = trimmed.toUpperCase();
      [decisionRow] = await db
        .select()
        .from(jevDecisions)
        .where(eq(jevDecisions.symbol, upperSym))
        .orderBy(desc(jevDecisions.createdAt))
        .limit(1);
    }

    if (!decisionRow) {
      return null;
    }

    const [oppScore] = await db
      .select()
      .from(opportunityScores)
      .where(
        and(
          eq(opportunityScores.symbol, decisionRow.symbol),
          eq(opportunityScores.cycleId, decisionRow.cycleId),
        ),
      )
      .limit(1);

    let factors: Record<string, number> | undefined;
    if (oppScore) {
      factors = {
        marketMomentum: oppScore.marketMomentum,
        narrativeMomentum: oppScore.narrativeMomentum,
        socialVelocity: oppScore.socialVelocity,
        culturalRelevance: oppScore.culturalRelevance,
        memeCompatibility: oppScore.memeCompatibility,
        cryptoAdjacency: oppScore.cryptoAdjacency,
        pairCompatibility: oppScore.pairCompatibility,
      };
    }

    return cleanDto({
      entity: "decision" as const,
      id: decisionRow.id,
      symbol: decisionRow.symbol,
      decision: decisionRow.decision,
      confidence: decisionRow.confidence,
      score: oppScore?.score,
      factors,
      evidenceRefs: decisionRow.signals,
      cycleId: decisionRow.cycleId,
      source: {
        providerMode: getProviderModeInfo(),
      },
      model: decisionRow.modelVersion,
      evaluatedAt: decisionRow.createdAt.toISOString(),
    });
  }

  /**
   * Retrieves recent memory and activity events.
   *
   * CRITICAL REQUIREMENT:
   * Does NOT fall back to "NVDA". If subjectId is omitted, queries all activities
   * across subjects without assuming or leaking any hardcoded fallback.
   */
  async getActivity(options?: {
    subjectId?: string;
    subjectType?: string;
    limit?: number;
  }): Promise<CanonicalIntelligenceDTO[]> {
    let query = db.select().from(memoryEvents);

    const conditions = [];

    // Explicitly filter by subjectId ONLY when provided by caller
    if (options?.subjectId && options.subjectId.trim().length > 0) {
      conditions.push(eq(memoryEvents.subjectId, options.subjectId.trim()));
    }

    if (options?.subjectType && options.subjectType.trim().length > 0) {
      conditions.push(eq(memoryEvents.subjectType, options.subjectType.toUpperCase().trim()));
    }

    if (conditions.length > 0) {
      query = db
        .select()
        .from(memoryEvents)
        .where(and(...conditions)) as typeof query;
    }

    const rows = await query
      .orderBy(desc(memoryEvents.recordedAt))
      .limit(options?.limit ?? 50);

    return rows.map((event) => {
      const currentState = (event.currentState as Record<string, unknown>) ?? {};

      return cleanDto({
        entity: "activity" as const,
        id: event.id,
        currentState,
        decision: event.decision ?? undefined,
        evidenceRefs: event.evidenceRefs ?? undefined,
        cycleId: event.cycleId,
        source: {
          providerMode: getProviderModeInfo(),
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          observedChange: event.observedChange,
        },
        evaluatedAt: event.recordedAt.toISOString(),
      });
    });
  }
}

export const jevoIntelligenceFacade = new JevoIntelligenceFacade();
