import type { FastifyPluginAsync } from "fastify";
import type { RankSnapshot } from "@jevo/protocol-types";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "../../db/client";
import { agentCycles, jevDecisions, rankHistory } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface OpportunityQuery {
  sort?: "rank" | "score";
  decision?: "promote" | "hold" | "demote";
  q?: string;
  [key: string]: unknown;
}

export const opportunitiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/opportunities", async (request, reply) => {
    const query = (request.query ?? {}) as OpportunityQuery;

    // 1. Find latest completed cycle ID (or latest cycle if none completed)
    const [latestCycle] = await db
      .select({ id: agentCycles.id })
      .from(agentCycles)
      .where(eq(agentCycles.status, "COMPLETED"))
      .orderBy(desc(agentCycles.startedAt))
      .limit(1);

    const targetCycleId =
      latestCycle?.id ??
      (
        await db
          .select({ id: agentCycles.id })
          .from(agentCycles)
          .orderBy(desc(agentCycles.startedAt))
          .limit(1)
      )[0]?.id;

    if (!targetCycleId) {
      return reply.send(formatResponse([]));
    }

    // 2. Query rank_history for target cycle
    const ranks = await db
      .select()
      .from(rankHistory)
      .where(eq(rankHistory.cycleId, targetCycleId));

    // 3. Query decisions for target cycle to support decision filter and enriched snapshot
    const decisions = await db
      .select()
      .from(jevDecisions)
      .where(eq(jevDecisions.cycleId, targetCycleId));

    const decisionMap = new Map<string, string>();
    for (const d of decisions) {
      decisionMap.set(d.symbol, d.decision);
    }

    // 4. Map to RankSnapshot objects
    let items: Array<RankSnapshot & { decision?: string }> = ranks.map((r) => ({
      cycleId: r.cycleId,
      symbol: r.symbol,
      currentRank: r.currentRank,
      previousRank: r.previousRank,
      opportunityScore: r.opportunityScore,
      recordedAt: r.recordedAt.toISOString(),
      decision: decisionMap.get(r.symbol),
    }));

    // 5. Apply filters (?q, ?decision)
    if (query.q && typeof query.q === "string") {
      const qLower = query.q.toLowerCase().trim();
      items = items.filter((item) => item.symbol.toLowerCase().includes(qLower));
    }

    if (query.decision && typeof query.decision === "string") {
      const decUpper = query.decision.toUpperCase().trim();
      items = items.filter((item) => item.decision === decUpper);
    }

    // 6. Apply sorting (?sort=score | rank)
    if (query.sort === "score") {
      items.sort((a, b) => b.opportunityScore - a.opportunityScore);
    } else {
      items.sort((a, b) => a.currentRank - b.currentRank);
    }

    return reply.send(formatResponse(items, { total: items.length }));
  });
};
