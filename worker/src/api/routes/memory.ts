import type { FastifyPluginAsync } from "fastify";
import type { MemoryEventRecord, MemoryEventSubjectType } from "@jevo/protocol-types";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { memoryEvents, rankHistory } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface MemoryQuery {
  subjectType?: string;
  subjectId?: string;
  [key: string]: unknown;
}

export const memoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/memory", async (request, reply) => {
    const query = (request.query ?? {}) as MemoryQuery;

    let targetSubjectId = query.subjectId?.trim();
    let targetSubjectType = query.subjectType?.toUpperCase().trim();

    // Default to top-ranked asset if subjectId not provided
    if (!targetSubjectId) {
      const [topRanked] = await db
        .select({ symbol: rankHistory.symbol })
        .from(rankHistory)
        .where(eq(rankHistory.currentRank, 1))
        .orderBy(desc(rankHistory.recordedAt))
        .limit(1);

      targetSubjectId = topRanked?.symbol ?? "NVDA";
      if (!targetSubjectType) {
        targetSubjectType = "ASSET";
      }
    }

    let rows = await db
      .select()
      .from(memoryEvents)
      .where(eq(memoryEvents.subjectId, targetSubjectId))
      .orderBy(desc(memoryEvents.recordedAt))
      .limit(50);

    if (targetSubjectType) {
      rows = rows.filter((r) => r.subjectType.toUpperCase() === targetSubjectType);
    }

    const items: MemoryEventRecord[] = rows.map((r) => ({
      id: r.id,
      subjectType: r.subjectType as MemoryEventSubjectType,
      subjectId: r.subjectId,
      cycleId: r.cycleId,
      previousState: r.previousState as Record<string, unknown>,
      observedChange: r.observedChange,
      decision: r.decision,
      currentState: r.currentState as Record<string, unknown>,
      evidenceRefs: r.evidenceRefs,
      recordedAt: r.recordedAt.toISOString(),
    }));

    return reply.send(formatResponse(items, { total: items.length }));
  });
};
