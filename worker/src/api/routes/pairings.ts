import type { FastifyPluginAsync } from "fastify";
import type { PairingCandidateRecord } from "@jevo/protocol-types";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "../../db/client";
import { pairingCandidates } from "../../db/schema";
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

    const items: PairingCandidateRecord[] = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      memeSymbol: r.memeSymbol,
      thesis: r.thesis,
      components: r.components,
      pairingScore: r.pairingScore,
      lifecycleState: r.lifecycleState as any,
      createdAt: r.createdAt.toISOString(),
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

    const result = {
      id: pairingRow.id,
      symbol: pairingRow.symbol,
      memeSymbol: pairingRow.memeSymbol,
      thesis: pairingRow.thesis,
      components: pairingRow.components,
      pairingScore: pairingRow.pairingScore,
      lifecycleState: pairingRow.lifecycleState as any,
      createdAt: pairingRow.createdAt.toISOString(),
      alternates,
    };

    return reply.send(formatResponse(result));
  });
};
