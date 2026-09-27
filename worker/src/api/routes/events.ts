import type { FastifyPluginAsync } from "fastify";
import type { ProtocolEvent } from "@jevo/protocol-types";
import { and, asc, eq, gt, gte } from "drizzle-orm";
import { db } from "../../db/client";
import { protocolEvents } from "../../db/schema";
import { subscribeToProtocolEvents } from "../../events";
import { formatResponse } from "../envelope";

export interface EventsQuery {
  since?: string;
  types?: string;
  cycleId?: string;
  limit?: string | number;
  lastEventId?: string;
  "last-event-id"?: string;
  [key: string]: unknown;
}

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /api/v1/events - Polling fallback endpoint
  fastify.get("/events", async (request, reply) => {
    const query = (request.query ?? {}) as EventsQuery;
    const limitNum = Math.min(200, Math.max(1, Number(query.limit) || 100));

    const conditions = [];

    // Filter by cycleId in SQL
    if (query.cycleId && typeof query.cycleId === "string") {
      conditions.push(eq(protocolEvents.cycleId, query.cycleId));
    }

    // Filter by since timestamp in SQL
    let sinceCursorEventId: string | null = null;
    if (query.since && typeof query.since === "string") {
      const sinceDate = new Date(query.since);
      if (!isNaN(sinceDate.getTime())) {
        conditions.push(gt(protocolEvents.createdAt, sinceDate));
      } else {
        sinceCursorEventId = query.since.trim();
      }
    }

    let queryBuilder = db.select().from(protocolEvents);
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    let rows = await queryBuilder
      .orderBy(asc(protocolEvents.createdAt))
      .limit(limitNum);

    // Filter by types (comma-separated list)
    if (query.types && typeof query.types === "string") {
      const allowedTypes = new Set(
        query.types.split(",").map((t) => t.trim().toUpperCase()),
      );
      rows = rows.filter((r) => allowedTypes.has(r.eventType.toUpperCase()));
    }

    // Filter by since cursor if it was an event ID
    if (sinceCursorEventId) {
      const cursorIndex = rows.findIndex((r) => r.eventId === sinceCursorEventId);
      if (cursorIndex >= 0) {
        rows = rows.slice(cursorIndex + 1);
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

  // 2. GET /api/v1/events/stream - Realtime Server-Sent Events (SSE) route
  fastify.get("/events/stream", async (request, reply) => {
    // Set standard SSE response headers
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");
    reply.raw.flushHeaders();

    const query = (request.query ?? {}) as EventsQuery;

    // Filter parameters
    const targetCycleId = query.cycleId ? String(query.cycleId).trim() : null;
    const allowedTypes = query.types
      ? new Set(String(query.types).split(",").map((t) => t.trim().toUpperCase()))
      : null;

    // Set of sent event IDs to guarantee zero duplicates across backfill & live
    const sentEventIds = new Set<string>();

    const sendEvent = (evt: ProtocolEvent) => {
      // Check cycleId filter
      if (targetCycleId && evt.cycleId !== targetCycleId) return;

      // Check event type filter
      if (allowedTypes && !allowedTypes.has(evt.eventType.toUpperCase())) return;

      // Deduplication guard
      if (sentEventIds.has(evt.eventId)) return;
      sentEventIds.add(evt.eventId);

      const sseMessage = `id: ${evt.eventId}\nevent: ${evt.eventType}\ndata: ${JSON.stringify(evt)}\n\n`;
      reply.raw.write(sseMessage);
    };

    let isBackfilling = true;
    const liveBuffer: ProtocolEvent[] = [];

    // Subscribe immediately to buffer incoming Redis events during backfill
    const unsubscribe = subscribeToProtocolEvents((event) => {
      if (isBackfilling) {
        liveBuffer.push(event);
      } else {
        sendEvent(event);
      }
    });

    // Reconnection handling: read Last-Event-ID header (or query param fallback)
    const rawLastEventId =
      (request.headers["last-event-id"] as string) ??
      (query["last-event-id"] as string) ??
      (query.lastEventId as string);

    if (rawLastEventId && typeof rawLastEventId === "string") {
      const lastEventId = rawLastEventId.trim();

      // Look up cursor event in protocol_events
      const [lastEvtRow] = await db
        .select()
        .from(protocolEvents)
        .where(eq(protocolEvents.eventId, lastEventId))
        .limit(1);

      let missedRows: Array<typeof protocolEvents.$inferSelect> = [];
      if (lastEvtRow) {
        // Query candidate rows created on or after cursor timestamp
        const candidateRows = await db
          .select()
          .from(protocolEvents)
          .where(gte(protocolEvents.createdAt, lastEvtRow.createdAt))
          .orderBy(asc(protocolEvents.createdAt), asc(protocolEvents.eventId));

        const cursorIndex = candidateRows.findIndex((r) => r.eventId === lastEventId);
        if (cursorIndex >= 0) {
          missedRows = candidateRows.slice(cursorIndex + 1);
        } else {
          missedRows = candidateRows.filter((r) => r.eventId !== lastEventId);
        }
      } else {
        const sinceDate = new Date(lastEventId);
        if (!isNaN(sinceDate.getTime())) {
          missedRows = await db
            .select()
            .from(protocolEvents)
            .where(gt(protocolEvents.createdAt, sinceDate))
            .orderBy(asc(protocolEvents.createdAt), asc(protocolEvents.eventId));
        }
      }

      // Backfill missed events in chronological order
      for (const row of missedRows) {
        sendEvent({
          eventId: row.eventId,
          eventType: row.eventType,
          cycleId: row.cycleId,
          subjectType: (row.subjectType as any) ?? null,
          subjectId: row.subjectId,
          payload: (row.payload as Record<string, unknown>) ?? {},
          schemaVersion: row.schemaVersion,
          actor: (row.actor as any) ?? "JEVO_AGENT",
          createdAt: row.createdAt.toISOString(),
        });
      }
    }

    // Finish backfill and drain buffered live events
    isBackfilling = false;
    for (const buffered of liveBuffer) {
      sendEvent(buffered);
    }
    liveBuffer.length = 0;

    // Heartbeat: send comment line ': heartbeat' every 15s to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        reply.raw.write(": heartbeat\n\n");
      } catch {
        // stream socket closed
      }
    }, 15000);

    // Clean up when client disconnects
    request.raw.on("close", () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
    });
  });
};
