import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  agentCycleRecordSchema,
  agentRuntimeSchema,
  launchCandidateRecordSchema,
  memoryEventRecordSchema,
  opportunityScoreDetailSchema,
  pairingCandidateRecordSchema,
  protocolEventSchema,
  rankSnapshotSchema,
  stockAssetSchema,
  jevDecisionRecordSchema,
} from "@jevo/protocol-types";
import { executeAgentCycle } from "../src/agent/cycle";
import { createServer } from "../src/api/server";
import { createEnvelopeSchema } from "../src/api/envelope";
import { db } from "../src/db/client";
import {
  agentCycles,
  jevDecisions,
  launchCandidates,
  launchCycles,
  memeConcepts,
  memoryEvents,
  opportunityScores,
  pairingCandidates,
  pairingDecisions,
  pairingHistory,
  protocolEvents,
  rankHistory,
} from "../src/db/schema";
import { seedAssets } from "../src/db/seed";

describe("REST API - Ten Endpoints (BACKEND 07)", () => {
  let app: FastifyInstance;
  const testCycleId = "cycle-api-test-01";

  beforeAll(async () => {
    // 1. Ensure DB has initial seeded stock assets
    await seedAssets();

    // 2. Seed a test meme concept for pairing so pairing candidates exist
    await db
      .insert(memeConcepts)
      .values({
        id: "mc-api-gpu",
        name: "$GPU",
        tags: ["nvda", "ai", "hardware", "chips"],
        notes: "Test concept for API tests",
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    // 3. Run a complete agent cycle to populate rank_history, opportunity_scores, jev_decisions, pairings, memory, and protocol events
    await executeAgentCycle("DELTA", {
      forcedCycleId: testCycleId,
      previousCycleId: null,
    });

    // 4. Instantiate Fastify app
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    // Close Fastify server
    await app.close();

    // Clean up test cycle data
    await db.delete(launchCycles);
    await db.delete(launchCandidates);
    await db.delete(pairingHistory);
    await db.delete(pairingDecisions);
    await db.delete(pairingCandidates);
    await db.delete(memeConcepts);
    await db.delete(rankHistory);
    await db.delete(opportunityScores);
    await db.delete(jevDecisions);
    await db.delete(memoryEvents);
    await db.delete(protocolEvents);
    await db.delete(agentCycles);
  });

  // --------------------------------------------------------------------------
  // 1. GET /api/v1/agent/status
  // --------------------------------------------------------------------------
  it("1. GET /api/v1/agent/status - returns 200 and valid AgentRuntime envelope", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/agent/status",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(agentRuntimeSchema);
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(json.data.status).toBe("ONLINE");
    expect(json.data.jevStatus).toBe("ACTIVE");
    expect(json.data.assetsScanned).toBeGreaterThan(0);
    expect(json.data.latestEvents.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 2. GET /api/v1/opportunities
  // --------------------------------------------------------------------------
  it("2. GET /api/v1/opportunities - returns 200, handles sort/filter, and ignores unknown params", async () => {
    // Basic call with unknown query parameter
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/opportunities?unknownParam=xyz123&sort=score&decision=promote",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(
      z.array(
        rankSnapshotSchema.extend({
          decision: z.string().optional(),
        }),
      ),
    );
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);

    // Verify sort by score
    for (let i = 1; i < json.data.length; i++) {
      expect(json.data[i - 1].opportunityScore).toBeGreaterThanOrEqual(
        json.data[i].opportunityScore,
      );
    }

    // Verify symbol query filter
    const qResponse = await app.inject({
      method: "GET",
      url: "/api/v1/opportunities?q=NVDA",
    });
    expect(qResponse.statusCode).toBe(200);
    const qJson = JSON.parse(qResponse.body);
    expect(qJson.data.length).toBe(1);
    expect(qJson.data[0].symbol).toBe("NVDA");
  });

  // --------------------------------------------------------------------------
  // 3. GET /api/v1/stocks/:symbol
  // --------------------------------------------------------------------------
  it("3. GET /api/v1/stocks/:symbol - returns 200 with full intelligence page and 404 for unknown", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/stocks/NVDA",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const stockDetailsSchema = createEnvelopeSchema(
      z.object({
        asset: stockAssetSchema,
        current: z.object({
          rank: z.number().int().positive(),
          previousRank: z.number().int().positive().nullable(),
          score: opportunityScoreDetailSchema.nullable(),
          decision: jevDecisionRecordSchema.nullable(),
        }),
        rankHistory: z.array(rankSnapshotSchema),
        scoreHistory: z.array(opportunityScoreDetailSchema),
        recentEvents: z.array(memoryEventRecordSchema),
        openPairings: z.array(pairingCandidateRecordSchema),
      }),
    );

    const parsed = stockDetailsSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data.asset.symbol).toBe("NVDA");
    expect(json.data.current.rank).toBeGreaterThanOrEqual(1);

    // 404 test
    const notFoundResponse = await app.inject({
      method: "GET",
      url: "/api/v1/stocks/UNKNOWN_COIN",
    });
    expect(notFoundResponse.statusCode).toBe(404);
  });

  // --------------------------------------------------------------------------
  // 4. GET /api/v1/pairings
  // --------------------------------------------------------------------------
  it("4. GET /api/v1/pairings - returns 200 and list of PairingCandidateRecord", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/pairings?status=proposed&randomParam=999",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(z.array(pairingCandidateRecordSchema));
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data).toBeArray();
  });

  // --------------------------------------------------------------------------
  // 5. GET /api/v1/pairings/:id
  // --------------------------------------------------------------------------
  it("5. GET /api/v1/pairings/:id - returns 200 with alternates and 404 when missing", async () => {
    // Get existing pairing candidate
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/pairings",
    });
    const listJson = JSON.parse(listRes.body);

    if (listJson.data.length > 0) {
      const candidateId = listJson.data[0].id;
      const detailRes = await app.inject({
        method: "GET",
        url: `/api/v1/pairings/${candidateId}`,
      });

      expect(detailRes.statusCode).toBe(200);
      const detailJson = JSON.parse(detailRes.body);

      const singlePairingSchema = createEnvelopeSchema(
        pairingCandidateRecordSchema.extend({
          alternates: z.array(pairingCandidateRecordSchema),
        }),
      );

      const parsed = singlePairingSchema.safeParse(detailJson);
      expect(parsed.success).toBe(true);
      expect(detailJson.data.id).toBe(candidateId);
    }

    // 404 test
    const notFoundRes = await app.inject({
      method: "GET",
      url: "/api/v1/pairings/non-existent-id",
    });
    expect(notFoundRes.statusCode).toBe(404);
  });

  // --------------------------------------------------------------------------
  // 6. GET /api/v1/launches
  // --------------------------------------------------------------------------
  it("6. GET /api/v1/launches - returns 200 with empty array (until BACKEND 10)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/launches",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(z.array(launchCandidateRecordSchema));
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data).toBeArray();
  });

  // --------------------------------------------------------------------------
  // 7. GET /api/v1/launches/:id
  // --------------------------------------------------------------------------
  it("7. GET /api/v1/launches/:id - returns 404 when not found", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/launches/LC-999",
    });

    expect(response.statusCode).toBe(404);
  });

  // --------------------------------------------------------------------------
  // 8. GET /api/v1/memory
  // --------------------------------------------------------------------------
  it("8. GET /api/v1/memory - returns 200 defaulting to top-ranked asset when subjectId omitted", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/memory?unrelated=true",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(z.array(memoryEventRecordSchema));
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data).toBeArray();
  });

  // --------------------------------------------------------------------------
  // 9. GET /api/v1/cycles
  // --------------------------------------------------------------------------
  it("9. GET /api/v1/cycles - returns 200 with list of AgentCycleRecord", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/cycles?limit=5&extraParam=123",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(z.array(agentCycleRecordSchema));
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0].id).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 10. GET /api/v1/events
  // --------------------------------------------------------------------------
  it("10. GET /api/v1/events - returns 200 with list of ProtocolEvent for polling fallback", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/events?cycleId=${testCycleId}&dummyQuery=test`,
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const schema = createEnvelopeSchema(z.array(protocolEventSchema));
    const parsed = schema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(json.data).toBeArray();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.meta?.cursor).toBeDefined();
  });
});
