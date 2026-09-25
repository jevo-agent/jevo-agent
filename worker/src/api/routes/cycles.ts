import type { FastifyPluginAsync } from "fastify";
import type { AgentCycleRecord } from "@jevo/protocol-types";
import { desc } from "drizzle-orm";
import { db } from "../../db/client";
import { agentCycles } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface CyclesQuery {
  limit?: string | number;
  [key: string]: unknown;
}

export const cyclesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/cycles", async (request, reply) => {
    const query = (request.query ?? {}) as CyclesQuery;
    const limitNum = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const rows = await db
      .select()
      .from(agentCycles)
      .orderBy(desc(agentCycles.startedAt))
      .limit(limitNum);

    const items: AgentCycleRecord[] = rows.map((r) => ({
      id: r.id,
      kind: r.kind as any,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      assetsScanned: r.assetsScanned,
      signalsProcessed: r.signalsProcessed,
      status: r.status as any,
    }));

    return reply.send(formatResponse(items, { total: items.length }));
  });
};
