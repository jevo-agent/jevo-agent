import type { FastifyPluginAsync } from "fastify";
import type { PairingCandidateRecord } from "@jevo/protocol-types";
import { and, desc, eq, ne, inArray } from "drizzle-orm";
import { db } from "../../db/client";
import { pairingCandidates, pairingDecisions, pairingHistory } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface PairingsQuery {
  status?: string;
  [key: string]: unknown;
}

export interface PairingIdParams {
  id: string;
}

export const pairingsRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/pairings
  fastify.get("/pairings", async (request, reply) => {
    const query = (request.query ?? {}) as PairingsQuery;

    let rows = await db
      .select()
      .from(pairingCandidates)
      .orderBy(desc(pairingCandidates.pairingScore));

    if (query.status && typeof query.status === "string") {
      const statusUpper = query.status.toUpperCase().trim();
      rows = rows.filter((r) => r.lifecycleState.toUpperCase() === statusUpper);
    }

    const ids = rows.map((row) => row.id);
    const [decisionRows, historyRows] = ids.length > 0
      ? await Promise.all([
          db.select().from(pairingDecisions).where(inArray(pairingDecisions.pairingCandidateId, ids)).orderBy(desc(pairingDecisions.createdAt)),
          db.select().from(pairingHistory).where(inArray(pairingHistory.pairingCandidateId, ids)).orderBy(desc(pairingHistory.transitionedAt)),
        ])
      : [[], []];
    const decisionByCandidate = new Map<string, typeof decisionRows[number]>();
    for (const decision of decisionRows) if (!decisionByCandidate.has(decision.pairingCandidateId)) decisionByCandidate.set(decision.pairingCandidateId, decision);
    const historyByCandidate = new Map<string, typeof historyRows>();
    for (const entry of historyRows) historyByCandidate.set(entry.pairingCandidateId, [...(historyByCandidate.get(entry.pairingCandidateId) ?? []), entry]);

    const items: Array<PairingCandidateRecord & { decision?: string; confidence?: number; history: Array<{ fromState: string; toState: string; actor: string; transitionedAt: string }> }> = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      memeSymbol: r.memeSymbol,
      thesis: r.thesis,
      components: r.components,
      pairingScore: r.pairingScore,
      lifecycleState: r.lifecycleState as any,
      createdAt: r.createdAt.toISOString(),
      decision: decisionByCandidate.get(r.id)?.decision,
      confidence: decisionByCandidate.get(r.id)?.confidence,
      history: (historyByCandidate.get(r.id) ?? []).map((entry) => ({
        fromState: entry.fromState,
        toState: entry.toState,
        actor: entry.actor,
        transitionedAt: entry.transitionedAt.toISOString(),
      })),
    }));

    return reply.send(formatResponse(items, { total: items.length }));
  });

  // 2. GET /api/v1/pairings/:id
  fastify.get<{ Params: PairingIdParams }>("/pairings/:id", async (request, reply) => {
    const { id } = request.params;
    if (!id) {
      return reply.status(400).send({ message: "ID parameter required" });
    }

    const [pairingRow] = await db
      .select()
      .from(pairingCandidates)
      .where(eq(pairingCandidates.id, id))
      .limit(1);

    if (!pairingRow) {
      return reply.status(404).send({ message: `Pairing candidate ${id} not found` });
    }

    // Look up alternates (other candidates for the same symbol)
    const alternateRows = await db
      .select()
      .from(pairingCandidates)
      .where(
        and(
          eq(pairingCandidates.symbol, pairingRow.symbol),
          ne(pairingCandidates.id, pairingRow.id),
        ),
      )
      .orderBy(desc(pairingCandidates.pairingScore));

    const alternates: PairingCandidateRecord[] = alternateRows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      memeSymbol: r.memeSymbol,
      thesis: r.thesis,
      components: r.components,
      pairingScore: r.pairingScore,
      lifecycleState: r.lifecycleState as any,
      createdAt: r.createdAt.toISOString(),
    }));

    const [latestDecision] = await db
      .select()
      .from(pairingDecisions)
      .where(eq(pairingDecisions.pairingCandidateId, pairingRow.id))
      .orderBy(desc(pairingDecisions.createdAt))
      .limit(1);
    const detailHistory = await db
      .select()
      .from(pairingHistory)
      .where(eq(pairingHistory.pairingCandidateId, pairingRow.id))
      .orderBy(desc(pairingHistory.transitionedAt));

    const result = {
      id: pairingRow.id,
      symbol: pairingRow.symbol,
      memeSymbol: pairingRow.memeSymbol,
      thesis: pairingRow.thesis,
      components: pairingRow.components,
      pairingScore: pairingRow.pairingScore,
      lifecycleState: pairingRow.lifecycleState as any,
      createdAt: pairingRow.createdAt.toISOString(),
      decision: latestDecision?.decision,
      confidence: latestDecision?.confidence,
      history: detailHistory.map((entry) => ({
        fromState: entry.fromState,
        toState: entry.toState,
        actor: entry.actor,
        transitionedAt: entry.transitionedAt.toISOString(),
      })),
      alternates,
    };

    return reply.send(formatResponse(result));
  });
};
