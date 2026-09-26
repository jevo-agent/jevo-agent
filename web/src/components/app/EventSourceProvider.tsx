"use client";

/**
 * EventSourceProvider
 *
 * Subscribes to the worker's SSE stream at /events/stream.
 * Maps each event type to one or more TanStack Query keys and calls
 * queryClient.invalidateQueries() so affected components re-fetch automatically.
 *
 * Fallback: when EventSource is unavailable (rare in modern browsers), the
 * provider falls back to polling GET /events?since=<cursor> every 8 seconds.
 *
 * Mount once, high in the React tree (inside <Providers>).
 */

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

// ─── Event → query key mapping (as specified in task) ────────────────────────

const EVENT_INVALIDATES: Record<string, (subjectId: string | null) => QueryKey[]> = {
  AGENT_SCAN_STARTED: () => [["agent-status"]],
  ASSET_ANALYZED: () => [["agent-status"]],
  JEV_DECISION_COMPLETED: () => [["agent-status"]],
  ASSET_PROMOTED: (subjectId) => [["opportunities"], ["stock", subjectId]],
  ASSET_DEMOTED: (subjectId) => [["opportunities"], ["stock", subjectId]],
  RANKING_UPDATED: () => [["opportunities"]],
  CYCLE_COMPLETED: () => [["agent-status"], ["cycles"]],
  CYCLE_FAILED: () => [["agent-status"], ["cycles"]],
  PAIRING_PROPOSED: () => [["pairings"]],
  PAIRING_UPDATED: (subjectId) => [["pairings"], ["pairing", subjectId]],
  LAUNCH_SELECTED: () => [["launches"]],
  COUNTDOWN_STARTED: (subjectId) => [["launches", subjectId]],
};

function getStreamUrl(): string | null {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/events/stream`;
  }
  // No SSE available in fixture mode — fall through to polling
  return null;
}

function getPollUrl(cursor?: string | null): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    const base = `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/events`;
    return cursor ? `${base}?since=${encodeURIComponent(cursor)}` : base;
  }
  // Fixture polling endpoint
  const base = "/api/fixture/events";
  return cursor ? `${base}?since=${encodeURIComponent(cursor)}` : base;
}

interface RawEvent {
  eventId?: string;
  eventType?: string;
  subjectId?: string | null;
  [k: string]: unknown;
}

export function EventSourceProvider() {
  const qc = useQueryClient();
  const cursorRef = useRef<string | null>(null);

  const invalidate = (eventType: string, subjectId: string | null) => {
    const factory = EVENT_INVALIDATES[eventType];
    if (!factory) return;
    const keys = factory(subjectId);
    for (const key of keys) {
      void qc.invalidateQueries({ queryKey: key });
    }
  };

  useEffect(() => {
    const streamUrl = getStreamUrl();

    // ── SSE branch ───────────────────────────────────────────────────────────
    if (streamUrl && typeof EventSource !== "undefined") {
      const es = new EventSource(streamUrl);

      es.onmessage = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data as string) as RawEvent;
          const type = event.eventType ?? (e as MessageEvent & { type?: string }).type ?? "";
          const subjectId = event.subjectId ?? null;
          if (event.eventId) cursorRef.current = event.eventId;
          invalidate(type, subjectId);
        } catch {
          // malformed event — ignore
        }
      };

      // Named event handlers for all mapped types
      for (const eventType of Object.keys(EVENT_INVALIDATES)) {
        es.addEventListener(eventType, (e: Event) => {
          const me = e as MessageEvent;
          try {
            const event = JSON.parse(me.data as string) as RawEvent;
            const subjectId = event.subjectId ?? null;
            if (event.eventId) cursorRef.current = event.eventId;
            invalidate(eventType, subjectId);
          } catch {
            // ignore
          }
        });
      }

      // Browser handles reconnect automatically — no manual retry needed
      return () => {
        es.close();
      };
    }

    // ── Polling fallback ─────────────────────────────────────────────────────
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(getPollUrl(cursorRef.current), {
          cache: "no-store",
        });
        if (!res.ok) return;

        const body = (await res.json()) as {
          data: RawEvent[];
          meta?: { cursor?: string };
        };

        const events = body.data ?? [];
        for (const event of events) {
          const type = event.eventType ?? "";
          const subjectId = event.subjectId ?? null;
          invalidate(type, subjectId);
        }

        // Advance cursor to last event id or meta cursor
        const last = events[events.length - 1];
        if (last?.eventId) cursorRef.current = last.eventId;
        else if (body.meta?.cursor) cursorRef.current = body.meta.cursor;
      } catch {
        // network error — retry on next tick
      }
    };

    const interval = setInterval(() => {
      if (active) void poll();
    }, 8_000);

    // Initial poll immediately
    void poll();

    return () => {
      active = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
