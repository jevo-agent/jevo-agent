import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import type { ProtocolEvent } from "@jevo/protocol-types";
import { eq } from "drizzle-orm";
import { createServer } from "../src/api/server";
import { closeEventBus, publishProtocolEvent } from "../src/events";
import { executeAgentCycle } from "../src/agent/cycle";
import { db } from "../src/db/client";
import { protocolEvents } from "../src/db/schema";
import { seedAssets } from "../src/db/seed";

interface ParsedSSE {
  id?: string;
  event?: string;
  data?: ProtocolEvent;
}

function parseSSEBlock(block: string): ParsedSSE | null {
  if (!block.trim() || block.startsWith(":")) return null;
  const lines = block.split("\n");
  const msg: ParsedSSE = {};
  for (const line of lines) {
    if (line.startsWith("id: ")) msg.id = line.slice(4).trim();
    else if (line.startsWith("event: ")) msg.event = line.slice(7).trim();
    else if (line.startsWith("data: ")) {
      try {
        msg.data = JSON.parse(line.slice(6));
      } catch {
        // non-json data
      }
    }
  }
  return msg.event ? msg : null;
}

describe("SSE Realtime Stream & Redis Pub/Sub (BACKEND 08)", () => {
  let server: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    // 1. Seed assets
    await seedAssets();

    // 2. Start server on ephemeral port
    server = await createServer();
    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const port = (server.server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;
  });

  afterAll(async () => {
    try {
      server.server.closeAllConnections?.();
      await server.close();
    } catch {
      // ignore
    }
    await closeEventBus();
  });

  it("CORS headers are returned on preflight and request", async () => {
    const res = await fetch(`${baseUrl}/events/stream`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Last-Event-ID",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("(a) connects test client to stream, triggers cycle, and receives live events in exact order", async () => {
    const testCycleId = `cycle-sse-live-${Date.now()}`;

    // 1. Connect to SSE stream filtered by cycleId
    const res = await fetch(`${baseUrl}/events/stream?cycleId=${testCycleId}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const receivedEvents: ParsedSSE[] = [];
    let buffer = "";

    // 2. Start reading stream in background
    const readPromise = (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSSEBlock(part);
          if (parsed) {
            receivedEvents.push(parsed);
            if (parsed.event === "CYCLE_COMPLETED") {
              await reader.cancel();
              return;
            }
          }
        }
      }
    })();

    // Allow connection to establish
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 3. Trigger manual cycle
    await executeAgentCycle("DELTA", {
      forcedCycleId: testCycleId,
      previousCycleId: null,
    });

    // 4. Wait for stream to receive CYCLE_COMPLETED
    await readPromise;

    // Assertions
    expect(receivedEvents.length).toBeGreaterThanOrEqual(4);

    // Sequence verification:
    // Event 0: AGENT_SCAN_STARTED
    expect(receivedEvents[0].event).toBe("AGENT_SCAN_STARTED");
    expect(receivedEvents[0].data?.cycleId).toBe(testCycleId);

    // Mid events: ASSET_ANALYZED
    const analyzedEvents = receivedEvents.filter((e) => e.event === "ASSET_ANALYZED");
    expect(analyzedEvents.length).toBeGreaterThan(0);

    // End events: RANKING_UPDATED and CYCLE_COMPLETED
    const rankingIndex = receivedEvents.findIndex((e) => e.event === "RANKING_UPDATED");
    const completedIndex = receivedEvents.findIndex((e) => e.event === "CYCLE_COMPLETED");

    expect(rankingIndex).toBeGreaterThan(0);
    expect(completedIndex).toBeGreaterThan(rankingIndex);
    expect(receivedEvents[completedIndex].event).toBe("CYCLE_COMPLETED");
  });

  it("(b) reconnect test: disconnects mid-cycle, reconnects with Last-Event-ID, backfills exact missed events with 0 gaps and 0 duplicates", async () => {
    const testCycleId = `cycle-sse-reconnect-${Date.now()}`;

    // 1. First connection: stream until first ASSET_ANALYZED then disconnect
    const res1 = await fetch(`${baseUrl}/events/stream?cycleId=${testCycleId}`);
    const reader1 = res1.body!.getReader();
    const decoder = new TextDecoder();
    const firstBatch: ParsedSSE[] = [];
    let buffer1 = "";

    const firstReadPromise = (async () => {
      while (true) {
        const { value, done } = await reader1.read();
        if (done) break;
        buffer1 += decoder.decode(value, { stream: true });
        const parts = buffer1.split("\n\n");
        buffer1 = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSSEBlock(part);
          if (parsed) {
            firstBatch.push(parsed);
            // Disconnect immediately after receiving the first ASSET_ANALYZED event
            if (parsed.event === "ASSET_ANALYZED") {
              await reader1.cancel();
              return;
            }
          }
        }
      }
    })();

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Run cycle to completion
    await executeAgentCycle("DELTA", {
      forcedCycleId: testCycleId,
      previousCycleId: null,
    });

    await firstReadPromise;

    expect(firstBatch.length).toBeGreaterThanOrEqual(2);
    const lastReceivedEvent = firstBatch[firstBatch.length - 1];
    expect(lastReceivedEvent.id).toBeDefined();
    const lastEventId = lastReceivedEvent.id!;

    // 2. Reconnect with Last-Event-ID
    const res2 = await fetch(`${baseUrl}/events/stream?cycleId=${testCycleId}`, {
      headers: {
        "Last-Event-ID": lastEventId,
      },
    });

    const reader2 = res2.body!.getReader();
    const secondBatch: ParsedSSE[] = [];
    let buffer2 = "";

    const secondReadPromise = (async () => {
      while (true) {
        const { value, done } = await reader2.read();
        if (done) break;
        buffer2 += decoder.decode(value, { stream: true });
        const parts = buffer2.split("\n\n");
        buffer2 = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSSEBlock(part);
          if (parsed) {
            secondBatch.push(parsed);
            if (parsed.event === "CYCLE_COMPLETED") {
              await reader2.cancel();
              return;
            }
          }
        }
      }
    })();

    await secondReadPromise;

    // Assertions on reconnect backfill:
    // (1) Zero duplicates: no event in secondBatch should be in firstBatch
    const firstIds = new Set(firstBatch.map((e) => e.id));
    for (const evt of secondBatch) {
      expect(firstIds.has(evt.id)).toBe(false);
    }

    // (2) The last event id was NOT re-sent
    expect(secondBatch.some((e) => e.id === lastEventId)).toBe(false);

    // (3) Zero gaps: combined stream contains all events for the cycle
    const combinedIds = [...firstBatch.map((e) => e.id!), ...secondBatch.map((e) => e.id!)];

    // Query DB directly to get the canonical sequence of events for this cycle
    const allDbEvents = await db
      .select()
      .from(protocolEvents)
      .where(eq(protocolEvents.cycleId, testCycleId));

    // Sort DB events by createdAt ASC
    allDbEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Both batches together must contain every single event of this cycle
    expect(combinedIds.length).toBe(allDbEvents.length);
    for (let i = 0; i < allDbEvents.length; i++) {
      expect(combinedIds[i]).toBe(allDbEvents[i].eventId);
    }

    // Second batch must conclude with CYCLE_COMPLETED
    expect(secondBatch[secondBatch.length - 1].event).toBe("CYCLE_COMPLETED");
  });

  it("filters live events by types query parameter", async () => {
    const testCycleId = `cycle-sse-types-${Date.now()}`;

    // Subscribe only to RANKING_UPDATED,CYCLE_COMPLETED
    const res = await fetch(
      `${baseUrl}/events/stream?cycleId=${testCycleId}&types=RANKING_UPDATED,CYCLE_COMPLETED`,
    );

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const received: ParsedSSE[] = [];
    let buffer = "";

    const readPromise = (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSSEBlock(part);
          if (parsed) {
            received.push(parsed);
            if (parsed.event === "CYCLE_COMPLETED") {
              await reader.cancel();
              return;
            }
          }
        }
      }
    })();

    await new Promise((resolve) => setTimeout(resolve, 150));

    await executeAgentCycle("DELTA", {
      forcedCycleId: testCycleId,
      previousCycleId: null,
    });

    await readPromise;

    expect(received.length).toBe(2);
    expect(received[0].event).toBe("RANKING_UPDATED");
    expect(received[1].event).toBe("CYCLE_COMPLETED");
    expect(received.some((e) => e.event === "AGENT_SCAN_STARTED")).toBe(false);
  });

  it("filters live events strictly by ?cycleId= query parameter", async () => {
    const targetCycleId = `cycle-target-${Date.now()}`;
    const otherCycleId = `cycle-other-${Date.now()}`;

    // Connect to SSE stream requesting ONLY events for targetCycleId
    const res = await fetch(`${baseUrl}/events/stream?cycleId=${targetCycleId}`);
    expect(res.status).toBe(200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const received: ParsedSSE[] = [];
    let buffer = "";

    const readPromise = (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSSEBlock(part);
          if (parsed) {
            received.push(parsed);
            if (parsed.event === "CYCLE_COMPLETED" && parsed.data?.cycleId === targetCycleId) {
              await reader.cancel();
              return;
            }
          }
        }
      }
    })();

    await new Promise((resolve) => setTimeout(resolve, 150));

    // First publish an event from the other cycle (must be ignored by the stream)
    await publishProtocolEvent({
      eventId: `evt-other-scan-${otherCycleId}`,
      eventType: "AGENT_SCAN_STARTED",
      cycleId: otherCycleId,
      subjectType: "cycle",
      subjectId: otherCycleId,
      payload: { cycleId: otherCycleId },
      schemaVersion: 1,
      actor: "JEVO_AGENT",
      createdAt: new Date().toISOString(),
    });

    // Then execute the target cycle
    await executeAgentCycle("DELTA", {
      forcedCycleId: targetCycleId,
      previousCycleId: null,
    });

    await readPromise;

    // Assert: stream received events from targetCycleId, and 0 events from otherCycleId
    expect(received.length).toBeGreaterThanOrEqual(4);
    expect(received.every((e) => e.data?.cycleId === targetCycleId)).toBe(true);
    expect(received.some((e) => e.data?.cycleId === otherCycleId)).toBe(false);
  });
});
