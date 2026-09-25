import type { FastifyPluginAsync } from "fastify";
import type { LaunchCandidateRecord } from "@jevo/protocol-types";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { launchCandidates } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface LaunchIdParams {
  id: string;
}

export const launchesRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/launches
  fastify.get("/launches", async (request, reply) => {
    const rows = await db.select().from(launchCandidates);

    const items: LaunchCandidateRecord[] = rows.map((r) => ({
      id: r.id,
      pairingCandidateId: r.pairingCandidateId,
      stage: r.stage as any,
      readiness: r.readiness as any,
      checksPassed: r.checksPassed,
      checksTotal: r.checksTotal,
      stageDeadlineAt: r.stageDeadlineAt.toISOString(),
      transactionStatus: "NOT_SUBMITTED" as const,
    }));

    return reply.send(formatResponse(items, { total: items.length }));
  });

  // 2. GET /api/v1/launches/:id
  fastify.get<{ Params: LaunchIdParams }>("/launches/:id", async (request, reply) => {
    const { id } = request.params;
    if (!id) {
      return reply.status(400).send({ message: "ID parameter required" });
    }

    const [row] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, id))
      .limit(1);

    if (!row) {
      return reply.status(404).send({ message: `Launch candidate ${id} not found` });
    }

    const result: LaunchCandidateRecord = {
      id: row.id,
      pairingCandidateId: row.pairingCandidateId,
      stage: row.stage as any,
      readiness: row.readiness as any,
      checksPassed: row.checksPassed,
      checksTotal: row.checksTotal,
      stageDeadlineAt: row.stageDeadlineAt.toISOString(),
      transactionStatus: "NOT_SUBMITTED" as const,
    };

    return reply.send(formatResponse(result));
  });
};
