import type { FastifyPluginAsync } from "fastify";
import type { OpportunityScoreDetail, RankSnapshot } from "@jevo/protocol-types";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { agentCycles, assets, jevDecisions, opportunityScores, rankHistory } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface OpportunityQuery {
  sort?: "rank" | "score";
  decision?: "promote" | "hold" | "demote";
  q?: string;
  [key: string]: unknown;
}

type OpportunityResponse = RankSnapshot & {
  decision?: string;
  confidence?: number;
  score?: OpportunityScoreDetail;
  previousScore?: number | null;
  asset?: { symbol: string; name: string; active: boolean };
  history: Array<{
    cycleId: string;
    currentRank: number;
    score: number;
    recordedAt: string;
    dimensions?: OpportunityScoreDetail;
  }>;
};
export const opportunitiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/opportunities", async (request, reply) => {
    const query = (request.query ?? {}) as OpportunityQuery;

    const completedCycles = await db
      .select({ id: agentCycles.id })
      .from(agentCycles)
      .where(eq(agentCycles.status, "COMPLETED"))
      .orderBy(desc(agentCycles.startedAt))
      .limit(2);

    const targetCycleId = completedCycles[0]?.id ?? (
      await db
        .select({ id: agentCycles.id })
        .from(agentCycles)
        .orderBy(desc(agentCycles.startedAt))
        .limit(1)
    )[0]?.id;

    if (!targetCycleId) return reply.send(formatResponse([]));

    const ranks = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.cycleId, targetCycleId));
    const symbols = ranks.map((rank) => rank.symbol);

    const [assetRows, historyRows, scoreRows, decisions] = symbols.length > 0
      ? await Promise.all([
          db.select().from(assets).where(inArray(assets.symbol, symbols)),
          db.select().from(rankHistory).where(inArray(rankHistory.symbol, symbols)).orderBy(desc(rankHistory.recordedAt)),
          db.select().from(opportunityScores).where(inArray(opportunityScores.symbol, symbols)),
          db.select().from(jevDecisions).where(eq(jevDecisions.cycleId, targetCycleId)),
        ])
      : [[], [], [], []];

    const decisionMap = new Map<string, string>();
    const confidenceMap = new Map<string, number>();
    for (const decision of decisions) {
      decisionMap.set(decision.symbol, decision.decision);
      confidenceMap.set(decision.symbol, decision.confidence);
    }

    const scoreMap = new Map<string, OpportunityScoreDetail>();
    for (const score of scoreRows) {
      scoreMap.set(`${score.cycleId}:${score.symbol}`, {
        symbol: score.symbol,
        cycleId: score.cycleId,
        marketMomentum: score.marketMomentum,
        narrativeMomentum: score.narrativeMomentum,
        socialVelocity: score.socialVelocity,
        culturalRelevance: score.culturalRelevance,
        memeCompatibility: score.memeCompatibility,
        cryptoAdjacency: score.cryptoAdjacency,
        pairCompatibility: score.pairCompatibility,
        score: score.score,
      });
    }

    const assetMap = new Map(assetRows.map((asset) => [asset.symbol, asset]));
    let items: OpportunityResponse[] = ranks.map((rank) => {
      const history = historyRows
        .filter((entry) => entry.symbol === rank.symbol)
        .sort((left, right) => left.recordedAt.getTime() - right.recordedAt.getTime())
        .map((entry) => ({
          cycleId: entry.cycleId,
          currentRank: entry.currentRank,
          score: entry.opportunityScore,
          recordedAt: entry.recordedAt.toISOString(),
          dimensions: scoreMap.get(`${entry.cycleId}:${entry.symbol}`),
        }));
      const asset = assetMap.get(rank.symbol);
      return {
        cycleId: rank.cycleId,
        symbol: rank.symbol,
        currentRank: rank.currentRank,
        previousRank: rank.previousRank,
        opportunityScore: rank.opportunityScore,
        previousScore: history.at(-2)?.score ?? null,
        recordedAt: rank.recordedAt.toISOString(),
        decision: decisionMap.get(rank.symbol),
        confidence: confidenceMap.get(rank.symbol),
        score: scoreMap.get(`${rank.cycleId}:${rank.symbol}`),
        asset: asset ? { symbol: asset.symbol, name: asset.name, active: asset.active } : undefined,
        history,
      };
    });

    if (query.q && typeof query.q === "string") {
      const qLower = query.q.toLowerCase().trim();
      items = items.filter((item) => item.symbol.toLowerCase().includes(qLower));
    }
    if (query.decision && typeof query.decision === "string") {
      const decUpper = query.decision.toUpperCase().trim();
      items = items.filter((item) => item.decision === decUpper);
    }
    if (query.sort === "score") items.sort((left, right) => right.opportunityScore - left.opportunityScore);
    else items.sort((left, right) => left.currentRank - right.currentRank);

    return reply.send(formatResponse(items, { total: items.length }));
  });
};
