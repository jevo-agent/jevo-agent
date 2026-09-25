import type { FastifyPluginAsync } from "fastify";
import type { ProtocolEvent } from "@jevo/protocol-types";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { protocolEvents } from "../../db/schema";
import { formatResponse } from "../envelope";

export interface EventsQuery {
  since?: string;
  types?: string;
  cycleId?: string;
  limit?: string | number;
  [key: string]: unknown;
}

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/events", async (request, reply) => {
    const query = (request.query ?? {}) as EventsQuery;
    const limitNum = Math.min(200, Math.max(1, Number(query.limit) || 100));

    let rows = await db
      .select()
      .from(protocolEvents)
      .orderBy(asc(protocolEvents.createdAt))
      .limit(limitNum);

    // Filter by cycleId if provided
    if (query.cycleId && typeof query.cycleId === "string") {
      rows = rows.filter((r) => r.cycleId === query.cycleId);
    }

    // Filter by types (comma-separated list)
    if (query.types && typeof query.types === "string") {
      const allowedTypes = new Set(
        query.types.split(",").map((t) => t.trim().toUpperCase()),
      );
      rows = rows.filter((r) => allowedTypes.has(r.eventType.toUpperCase()));
    }

    // Filter by since cursor (timestamp or eventId)
    if (query.since && typeof query.since === "string") {
      const sinceDate = new Date(query.since);
      if (!isNaN(sinceDate.getTime())) {
        rows = rows.filter((r) => r.createdAt.getTime() > sinceDate.getTime());
      } else {
        // String ID cursor fallback
        const sinceId = query.since.trim();
        const cursorIndex = rows.findIndex((r) => r.eventId === sinceId);
        if (cursorIndex >= 0) {
          rows = rows.slice(cursorIndex + 1);
        }
      }
    }

    const items: ProtocolEvent[] = rows.map((r) => ({
      eventId: r.eventId,
      eventType: r.eventType,
      cycleId: r.cycleId,
      subjectType: (r.subjectType as any) ?? null,
      subjectId: r.subjectId,
      payload: (r.payload as Record<string, unknown>) ?? {},
      schemaVersion: r.schemaVersion,
      actor: (r.actor as any) ?? "JEVO_AGENT",
      createdAt: r.createdAt.toISOString(),
    }));

    const lastItem = items[items.length - 1];
    const cursor = lastItem?.eventId ?? query.since;

    return reply.send(formatResponse(items, { cursor, total: items.length }));
  });
};
