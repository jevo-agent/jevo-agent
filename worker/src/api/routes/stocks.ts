import type { FastifyPluginAsync } from "fastify";
import type {
  JevDecisionRecord,
  MemoryEventRecord,
  OpportunityScoreDetail,
  PairingCandidateRecord,
  RankSnapshot,
  StockAsset,
} from "@jevo/protocol-types";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import {
  assets,
  jevDecisions,
  memoryEvents,
  opportunityScores,
  pairingCandidates,
  rankHistory,
} from "../../db/schema";
import { formatResponse } from "../envelope";

export interface StockParams {
  symbol: string;
}

export const stocksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: StockParams }>("/stocks/:symbol", async (request, reply) => {
    const rawSymbol = request.params.symbol;
    if (!rawSymbol) {
      return reply.status(400).send({ message: "Symbol parameter required" });
    }
    const symbol = rawSymbol.toUpperCase().trim();

    // 1. Query asset from assets table
    const [assetRow] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    if (!assetRow) {
      return reply.status(404).send({ message: `Stock asset ${symbol} not found` });
    }

    const asset: StockAsset = {
      symbol: assetRow.symbol,
      name: assetRow.name,
      stockTokenAddress: assetRow.stockTokenAddress,
      active: assetRow.active,
      createdAt: assetRow.createdAt ? assetRow.createdAt.toISOString() : undefined,
    };

    // 2. Query latest rank snapshot
    const [latestRankRow] = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.symbol, symbol))
      .orderBy(desc(rankHistory.recordedAt))
      .limit(1);

    // 3. Query latest score
    const [latestScoreRow] = await db
      .select()
      .from(opportunityScores)
      .where(eq(opportunityScores.symbol, symbol))
      .orderBy(desc(opportunityScores.cycleId))
      .limit(1);

    // An asset can exist before the worker has published a ranking state. Do
    // not manufacture a score/rank/decision for that case; the frontend must
    // surface the unavailable canonical state instead.
    if (!latestRankRow || !latestScoreRow) {
      return reply.status(409).send({
        message: `No canonical opportunity state is available for ${symbol}`,
      });
    }

    // 4. Query latest decision
    const [latestDecisionRow] = await db
      .select()
      .from(jevDecisions)
      .where(eq(jevDecisions.symbol, symbol))
      .orderBy(desc(jevDecisions.createdAt))
      .limit(1);

    // 5. Query rank history (up to 30 points)
    const rankRows = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.symbol, symbol))
      .orderBy(desc(rankHistory.recordedAt))
      .limit(30);

    const rankHistoryList: RankSnapshot[] = rankRows.map((r) => ({
      cycleId: r.cycleId,
      symbol: r.symbol,
      currentRank: r.currentRank,
      previousRank: r.previousRank,
      opportunityScore: r.opportunityScore,
      recordedAt: r.recordedAt.toISOString(),
    }));

    // 6. Query score history (up to 30 points)
    const scoreRows = await db
      .select()
      .from(opportunityScores)
      .where(eq(opportunityScores.symbol, symbol))
      .orderBy(desc(opportunityScores.cycleId))
      .limit(30);

    const rankTimeByCycle = new Map(rankRows.map((row) => [row.cycleId, row.recordedAt.toISOString()]));

    const scoreHistoryList = scoreRows.map((s) => ({
      symbol: s.symbol,
      cycleId: s.cycleId,
      marketMomentum: s.marketMomentum,
      narrativeMomentum: s.narrativeMomentum,
      socialVelocity: s.socialVelocity,
      culturalRelevance: s.culturalRelevance,
      memeCompatibility: s.memeCompatibility,
      cryptoAdjacency: s.cryptoAdjacency,
      pairCompatibility: s.pairCompatibility,
      score: s.score,
      ...(rankTimeByCycle.has(s.cycleId) ? { recordedAt: rankTimeByCycle.get(s.cycleId) } : {}),
    }));

    // 7. Query recent memory events (up to 10 points)
    const memoryRows = await db
      .select()
      .from(memoryEvents)
      .where(eq(memoryEvents.subjectId, symbol))
      .orderBy(desc(memoryEvents.recordedAt))
      .limit(10);

    const recentEventsList: MemoryEventRecord[] = memoryRows.map((m) => ({
      id: m.id,
      subjectType: m.subjectType as any,
      subjectId: m.subjectId,
      cycleId: m.cycleId,
      previousState: m.previousState as Record<string, unknown>,
      observedChange: m.observedChange,
      decision: m.decision,
      currentState: m.currentState as Record<string, unknown>,
      evidenceRefs: m.evidenceRefs,
      recordedAt: m.recordedAt.toISOString(),
    }));

    // 8. Query open pairing candidates (lifecycle_state = 'PROPOSED')
    const pairingRows = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.symbol, symbol))
      .orderBy(desc(pairingCandidates.pairingScore));

    const openPairingsList: PairingCandidateRecord[] = pairingRows.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      memeSymbol: p.memeSymbol,
      thesis: p.thesis,
      components: p.components,
      pairingScore: p.pairingScore,
      lifecycleState: p.lifecycleState as any,
      createdAt: p.createdAt.toISOString(),
    }));

    const responseData = {
      asset,
      current: {
        rank: latestRankRow.currentRank,
        previousRank: latestRankRow.previousRank,
        score: {
          symbol: latestScoreRow.symbol,
          cycleId: latestScoreRow.cycleId,
          marketMomentum: latestScoreRow.marketMomentum,
          narrativeMomentum: latestScoreRow.narrativeMomentum,
          socialVelocity: latestScoreRow.socialVelocity,
          culturalRelevance: latestScoreRow.culturalRelevance,
          memeCompatibility: latestScoreRow.memeCompatibility,
          cryptoAdjacency: latestScoreRow.cryptoAdjacency,
          pairCompatibility: latestScoreRow.pairCompatibility,
          score: latestScoreRow.score,
        },
        decision: latestDecisionRow
          ? {
              id: latestDecisionRow.id,
              cycleId: latestDecisionRow.cycleId,
              symbol: latestDecisionRow.symbol,
              decision: latestDecisionRow.decision as any,
              confidence: latestDecisionRow.confidence,
              signals: latestDecisionRow.signals,
              modelVersion: latestDecisionRow.modelVersion,
              createdAt: latestDecisionRow.createdAt.toISOString(),
            }
          : null,
      },
      rankHistory: rankHistoryList,
      scoreHistory: scoreHistoryList,
      recentEvents: recentEventsList,
      openPairings: openPairingsList,
    };

    return reply.send(formatResponse(responseData));
  });
};
