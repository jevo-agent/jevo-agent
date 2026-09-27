import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { createServer } from "../src/api/server";
import { db } from "../src/db/client";
import {
  agentConfigVersions,
  launchCandidates,
  launchCycles,
  memeConcepts,
  pairingCandidates,
  pairingDecisions,
  pairingHistory,
  protocolEvents,
} from "../src/db/schema";
import { seedAssets } from "../src/db/seed";
import { executeAgentCycle } from "../src/agent/cycle";
import { closeCycleQueue, getCycleQueue } from "../src/jobs/queues";
import { closeEventBus } from "../src/events";
import {
  getAllowedAdminTokens,
  getEphemeralDevToken,
  resetAllowedAdminTokensCache,
} from "../src/api/authz";
import { env } from "../src/config/env";
import { launchSchema } from "@jevo/protocol-types";

describe("Admin API (BACKEND 10)", () => {
  let app: FastifyInstance;
  let validToken: string;
  let authHeaders: { Authorization: string };

  let testPairingIdApprove: string;
  let testPairingIdReject: string;
  let testPairingIdEdit: string;
  let testPairingIdScheduleCurated: string;
  let testPairingIdScheduleProposed: string;
  let scheduledLaunchId: string;

  beforeAll(async () => {
    // 0. Ensure no leftover operator configs
    await db
      .delete(agentConfigVersions)
      .where(eq(agentConfigVersions.createdBy, "OPERATOR"));

    // 1. Seed assets
    await seedAssets();

    // 2. Seed test meme concept for pairing candidates
    await db
      .insert(memeConcepts)
      .values({
        id: "mc-admin-test-gpu",
        name: "$GPU",
        tags: ["nvda", "ai", "hardware"],
        notes: "Test meme concept for Admin API tests",
      })
      .onConflictDoNothing();

    // 3. Create Fastify test app and derive active admin token
    app = await createServer();
    (env as any).ADMIN_API_TOKENS = "test-admin-suite-token";
    resetAllowedAdminTokensCache();
    const tokens = getAllowedAdminTokens();
    validToken = [...tokens][0]!;
    authHeaders = { Authorization: `Bearer ${validToken}` };

    // 4. Run an agent cycle to establish database context
    await executeAgentCycle("DELTA", {
      forcedCycleId: `cycle-admin-init-${Date.now()}`,
    });

    // 5. Seed controlled, isolated pairing candidates for test actions
    testPairingIdApprove = `pc-admin-appr-${randomUUID().slice(0, 8)}`;
    testPairingIdReject = `pc-admin-rej-${randomUUID().slice(0, 8)}`;
    testPairingIdEdit = `pc-admin-edit-${randomUUID().slice(0, 8)}`;
    testPairingIdScheduleCurated = `pc-admin-sched-cur-${randomUUID().slice(0, 8)}`;
    testPairingIdScheduleProposed = `pc-admin-sched-prop-${randomUUID().slice(0, 8)}`;

    const initialThesis = {
      whyStock: "Top market momentum",
      whyMeme: "Original meme thesis",
      whyPair: "Strong affinity",
      whyNow: "Breaking narrative",
    };
    const initialComponents = {
      narrative: 85,
      cultural: 80,
      meme: 90,
      crypto: 75,
      timing: 88,
      stockRelevance: 70,
    };

    await db.insert(pairingCandidates).values([
      {
        id: testPairingIdApprove,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: initialThesis,
        components: initialComponents,
        pairingScore: 81.5,
        lifecycleState: "PROPOSED",
      },
      {
        id: testPairingIdReject,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: initialThesis,
        components: initialComponents,
        pairingScore: 81.5,
        lifecycleState: "PROPOSED",
      },
      {
        id: testPairingIdEdit,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: initialThesis,
        components: initialComponents,
        pairingScore: 81.5,
        lifecycleState: "PROPOSED",
      },
      {
        id: testPairingIdScheduleCurated,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: initialThesis,
        components: initialComponents,
        pairingScore: 81.5,
        lifecycleState: "CURATED",
      },
      {
        id: testPairingIdScheduleProposed,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: initialThesis,
        components: initialComponents,
        pairingScore: 81.5,
        lifecycleState: "PROPOSED",
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
    await closeCycleQueue();
    await closeEventBus();

    // Clean up test data
    await db.delete(launchCycles);
    await db.delete(launchCandidates);
    await db.delete(pairingHistory);
    await db.delete(pairingDecisions);
    await db.delete(pairingCandidates);
    await db
      .delete(agentConfigVersions)
      .where(eq(agentConfigVersions.createdBy, "OPERATOR"));
  });

  // --------------------------------------------------------------------------
  // Authorization Guards: All 7 routes require valid Bearer token
  // --------------------------------------------------------------------------
  describe("Authentication & Authorization Guard", () => {
    it("returns 401 for all routes when Authorization header is missing", async () => {
      const routes = [
        { method: "POST" as const, url: "/api/v1/admin/scan/trigger", payload: { kind: "DELTA" } },
        { method: "POST" as const, url: "/api/v1/admin/agent/pause" },
        { method: "POST" as const, url: "/api/v1/admin/agent/resume" },
        { method: "POST" as const, url: "/api/v1/admin/pairings/pc-dummy-401/approve" },
        { method: "POST" as const, url: "/api/v1/admin/pairings/pc-dummy-401/reject" },
        { method: "POST" as const, url: "/api/v1/admin/pairings/pc-dummy-401/edit", payload: { memeSymbol: "$TEST" } },
        { method: "POST" as const, url: "/api/v1/admin/launches/schedule", payload: { pairingCandidateId: "pc-dummy-401" } },
        { method: "POST" as const, url: "/api/v1/admin/config/weights", payload: {} },
        { method: "POST" as const, url: "/api/v1/admin/launches/LC-DUMMY-401/emergency-pause" },
      ];

      for (const route of routes) {
        const res = await app.inject({
          method: route.method,
          url: route.url,
          payload: route.payload,
        });
        expect(res.statusCode).toBe(401);
      }
    });

    it("returns 401 when Authorization token is invalid", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/scan/trigger",
        headers: { Authorization: "Bearer wrong-invalid-secret-key" },
        payload: { kind: "DELTA" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // Action 1: POST /api/v1/admin/scan/trigger
  // --------------------------------------------------------------------------
  describe("Action 1: POST /api/v1/admin/scan/trigger", () => {
    it("enqueues manual cycle job, writes protocol_events with actor OPERATOR", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/scan/trigger",
        headers: authHeaders,
        payload: { kind: "DELTA" },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.triggered).toBe(true);
      expect(json.data.kind).toBe("DELTA");
      expect(json.data.jobId).toContain("manual-DELTA:");

      // Assert protocol_events row persisted with actor: OPERATOR
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "AGENT_SCAN_TRIGGERED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);

      expect(evt).toBeDefined();
      expect(evt.actor).toBe("OPERATOR");
      expect((evt.payload as any).kind).toBe("DELTA");
    });
  });

  // --------------------------------------------------------------------------
  // Action 2: POST /api/v1/admin/agent/pause and /resume
  // --------------------------------------------------------------------------
  describe("Action 2: POST /api/v1/admin/agent/pause and /resume", () => {
    it("pauses and resumes cycle loop natively in BullMQ, live reflected in GET /agent/status", async () => {
      // 1. Pause agent
      const pauseRes = await app.inject({
        method: "POST",
        url: "/api/v1/admin/agent/pause",
        headers: authHeaders,
      });
      expect(pauseRes.statusCode).toBe(200);
      expect(JSON.parse(pauseRes.body).data.status).toBe("PAUSED");

      // Verify GET /api/v1/agent/status reads live paused state
      const statusRes1 = await app.inject({
        method: "GET",
        url: "/api/v1/agent/status",
      });
      expect(statusRes1.statusCode).toBe(200);
      const statusJson1 = JSON.parse(statusRes1.body);
      expect(statusJson1.data.status).toBe("PAUSED");
      expect(statusJson1.data.currentOperation).toBe("PAUSED");

      // Verify audit event persisted
      const [pauseEvt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "AGENT_PAUSED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);
      expect(pauseEvt).toBeDefined();

      // 2. Resume agent
      const resumeRes = await app.inject({
        method: "POST",
        url: "/api/v1/admin/agent/resume",
        headers: authHeaders,
      });
      expect(resumeRes.statusCode).toBe(200);
      expect(JSON.parse(resumeRes.body).data.status).toBe("RESUMED");

      // Verify GET /api/v1/agent/status reads live online state
      const statusRes2 = await app.inject({
        method: "GET",
        url: "/api/v1/agent/status",
      });
      expect(statusRes2.statusCode).toBe(200);
      const statusJson2 = JSON.parse(statusRes2.body);
      expect(statusJson2.data.status).toBe("ONLINE");

      // Verify audit event persisted
      const [resumeEvt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "AGENT_RESUMED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);
      expect(resumeEvt).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Action 3: POST /api/v1/admin/pairings/:id/approve & reject
  // --------------------------------------------------------------------------
  describe("Action 3: POST /api/v1/admin/pairings/:id/approve and /reject", () => {
    it("approves pairing: PROPOSED -> CURATED in pairing_candidates and records pairing_history", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/admin/pairings/${testPairingIdApprove}/approve`,
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.lifecycleState).toBe("CURATED");

      // Verify pairing_candidates row
      const [candidate] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, testPairingIdApprove))
        .limit(1);
      expect(candidate.lifecycleState).toBe("CURATED");

      // Verify pairing_history transition
      const [history] = await db
        .select()
        .from(pairingHistory)
        .where(eq(pairingHistory.pairingCandidateId, testPairingIdApprove))
        .orderBy(desc(pairingHistory.transitionedAt))
        .limit(1);
      expect(history.fromState).toBe("PROPOSED");
      expect(history.toState).toBe("CURATED");
      expect(history.actor).toBe("OPERATOR");

      // Verify pairing_decisions was NOT touched / modified
      const decisions = await db
        .select()
        .from(pairingDecisions)
        .where(eq(pairingDecisions.pairingCandidateId, testPairingIdApprove));
      expect(decisions.length).toBe(0);

      // Verify audit event persisted
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "PAIRING_CURATED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);
      expect(evt).toBeDefined();
      expect(evt.subjectId).toBe(testPairingIdApprove);
    });

    it("rejects pairing: PROPOSED -> ARCHIVED in pairing_candidates and records pairing_history", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/admin/pairings/${testPairingIdReject}/reject`,
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.lifecycleState).toBe("ARCHIVED");

      // Verify pairing_candidates row
      const [candidate] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, testPairingIdReject))
        .limit(1);
      expect(candidate.lifecycleState).toBe("ARCHIVED");

      // Verify pairing_history transition
      const [history] = await db
        .select()
        .from(pairingHistory)
        .where(eq(pairingHistory.pairingCandidateId, testPairingIdReject))
        .orderBy(desc(pairingHistory.transitionedAt))
        .limit(1);
      expect(history.fromState).toBe("PROPOSED");
      expect(history.toState).toBe("ARCHIVED");
      expect(history.actor).toBe("OPERATOR");

      // Verify audit event persisted
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "PAIRING_ARCHIVED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);
      expect(evt).toBeDefined();
      expect(evt.subjectId).toBe(testPairingIdReject);
    });
  });

  // --------------------------------------------------------------------------
  // Action 4: POST /api/v1/admin/pairings/:id/edit
  // --------------------------------------------------------------------------
  describe("Action 4: POST /api/v1/admin/pairings/:id/edit", () => {
    it("updates thesis content and memeSymbol without changing lifecycleState or writing pairing_history", async () => {
      const editPayload = {
        memeSymbol: "$GPU2",
        thesis: {
          whyMeme: "Updated meme narrative for Q4",
          whyNow: "Catalyst imminent",
        },
      };

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/admin/pairings/${testPairingIdEdit}/edit`,
        headers: authHeaders,
        payload: editPayload,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.memeSymbol).toBe("$GPU2");
      expect(json.data.thesis.whyMeme).toBe("Updated meme narrative for Q4");
      expect(json.data.thesis.whyStock).toBe("Top market momentum"); // preserved
      expect(json.data.lifecycleState).toBe("PROPOSED"); // unchanged

      // DB assert
      const [candidate] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, testPairingIdEdit))
        .limit(1);
      expect(candidate.memeSymbol).toBe("$GPU2");
      expect((candidate.thesis as any).whyMeme).toBe("Updated meme narrative for Q4");
      expect(candidate.lifecycleState).toBe("PROPOSED");

      // Assert pairing_history has NO entries for this edit
      const histories = await db
        .select()
        .from(pairingHistory)
        .where(eq(pairingHistory.pairingCandidateId, testPairingIdEdit));
      expect(histories.length).toBe(0);

      // Assert protocol_events audit event recorded
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "PAIRING_EDITED"),
          ),
        )
        .orderBy(desc(protocolEvents.createdAt))
        .limit(1);
      expect(evt).toBeDefined();
      expect(evt.subjectId).toBe(testPairingIdEdit);
    });
  });

  // --------------------------------------------------------------------------
  // Action 5: POST /api/v1/admin/launches/schedule
  // --------------------------------------------------------------------------
  describe("Action 5: POST /api/v1/admin/launches/schedule", () => {
    it("refuses scheduling when pairingCandidate lifecycleState is not CURATED (returns 409)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/launches/schedule",
        headers: authHeaders,
        payload: { pairingCandidateId: testPairingIdScheduleProposed },
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body).message).toContain("must be in CURATED state");
    });

    it("schedules launch when candidate is CURATED: creates launch candidate, 6 stages, updates pairing, and publishes events", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/launches/schedule",
        headers: authHeaders,
        payload: { pairingCandidateId: testPairingIdScheduleCurated },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.data.id).toContain("LC-");
      expect(json.data.stage).toBe("CANDIDATE_SELECTED");
      expect(json.data.readiness).toBe("PREPARING");
      scheduledLaunchId = json.data.id;

      // 1. Verify launch_candidates row
      const [launch] = await db
        .select()
        .from(launchCandidates)
        .where(eq(launchCandidates.id, scheduledLaunchId))
        .limit(1);
      expect(launch).toBeDefined();
      expect(launch.pairingCandidateId).toBe(testPairingIdScheduleCurated);
      expect(launch.stage).toBe("CANDIDATE_SELECTED");
      expect(launch.readiness).toBe("PREPARING");
      expect(launch.checksPassed).toBe(0);
      expect(launch.checksTotal).toBe(8);
      expect(launch.transactionStatus).toBe("NOT_SUBMITTED");

      // 2. Verify 6 launch_cycles rows
      const stages = await db
        .select()
        .from(launchCycles)
        .where(eq(launchCycles.launchCandidateId, scheduledLaunchId));
      expect(stages.length).toBe(6);

      const t24 = stages.find((s) => s.stageLabel === "T-24H");
      expect(t24?.status).toBe("COMPLETE");
      expect(t24?.completedAt).not.toBeNull();

      const pendingStages = stages.filter((s) => s.stageLabel !== "T-24H");
      expect(pendingStages.length).toBe(5);
      for (const p of pendingStages) {
        expect(p.status).toBe("PENDING");
        expect(p.completedAt).toBeNull();
      }

      // 3. Verify pairing_candidates lifecycleState transitioned CURATED -> LAUNCH_CANDIDATE
      const [candidate] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, testPairingIdScheduleCurated))
        .limit(1);
      expect(candidate.lifecycleState).toBe("LAUNCH_CANDIDATE");

      // 4. Verify pairing_history transition
      const [history] = await db
        .select()
        .from(pairingHistory)
        .where(
          and(
            eq(pairingHistory.pairingCandidateId, testPairingIdScheduleCurated),
            eq(pairingHistory.toState, "LAUNCH_CANDIDATE"),
          ),
        )
        .limit(1);
      expect(history.fromState).toBe("CURATED");
      expect(history.actor).toBe("OPERATOR");

      // 5. Verify protocol events: LAUNCH_SELECTED and COUNTDOWN_STARTED
      const [selectedEvt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "LAUNCH_SELECTED"),
            eq(protocolEvents.subjectId, scheduledLaunchId),
          ),
        )
        .limit(1);
      expect(selectedEvt).toBeDefined();

      const [countdownEvt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "COUNTDOWN_STARTED"),
            eq(protocolEvents.subjectId, scheduledLaunchId),
          ),
        )
        .limit(1);
      expect(countdownEvt).toBeDefined();
    });

    it("returns 409 when attempting to schedule a candidate that already has an active launch", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/launches/schedule",
        headers: authHeaders,
        payload: { pairingCandidateId: testPairingIdScheduleCurated },
      });
      expect(res.statusCode).toBe(409);
    });
  });

  // --------------------------------------------------------------------------
  // Action 6: POST /api/v1/admin/config/weights
  // --------------------------------------------------------------------------
  describe("Action 6: POST /api/v1/admin/config/weights", () => {
    it("persists new score weights via createConfigVersion, records CONFIG_UPDATED event with actor OPERATOR", async () => {
      const newWeights = {
        marketMomentum: 0.2,
        narrativeMomentum: 0.2,
        socialVelocity: 0.1,
        culturalRelevance: 0.15,
        memeCompatibility: 0.15,
        cryptoAdjacency: 0.1,
        pairCompatibility: 0.1,
      };

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/config/weights",
        headers: authHeaders,
        payload: newWeights,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.configId).toContain("config-v");
      expect(json.data.weights.marketMomentum).toBe(0.2);

      // Verify agent_config_versions row
      const [config] = await db
        .select()
        .from(agentConfigVersions)
        .where(eq(agentConfigVersions.id, json.data.configId))
        .limit(1);
      expect(config).toBeDefined();
      expect(config.createdBy).toBe("OPERATOR");

      // Verify protocol_events audit row
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "CONFIG_UPDATED"),
            eq(protocolEvents.subjectId, json.data.configId),
          ),
        )
        .limit(1);
      expect(evt).toBeDefined();
    });

    it("rejects weights that do not sum to 1.0 with 400 Bad Request", async () => {
      const invalidWeights = {
        marketMomentum: 0.5,
        narrativeMomentum: 0.5,
        socialVelocity: 0.5,
        culturalRelevance: 0.1,
        memeCompatibility: 0.1,
        cryptoAdjacency: 0.1,
        pairCompatibility: 0.1,
      };

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/config/weights",
        headers: authHeaders,
        payload: invalidWeights,
      });
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toContain("sum to 1.0");
    });
  });

  // --------------------------------------------------------------------------
  // Action 7: POST /api/v1/admin/launches/:id/emergency-pause
  // --------------------------------------------------------------------------
  describe("Action 7: POST /api/v1/admin/launches/:id/emergency-pause", () => {
    it("sets readiness='PAUSED' on target launch candidate and publishes audit event", async () => {
      expect(scheduledLaunchId).toBeDefined();

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/admin/launches/${scheduledLaunchId}/emergency-pause`,
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.readiness).toBe("PAUSED");
      expect(json.data.emergencyPaused).toBe(true);

      // Verify DB row
      const [updatedLaunch] = await db
        .select()
        .from(launchCandidates)
        .where(eq(launchCandidates.id, scheduledLaunchId))
        .limit(1);
      expect(updatedLaunch.readiness).toBe("PAUSED");

      // Verify audit event persisted with actor OPERATOR
      const [evt] = await db
        .select()
        .from(protocolEvents)
        .where(
          and(
            eq(protocolEvents.actor, "OPERATOR"),
            eq(protocolEvents.eventType, "LAUNCH_EMERGENCY_PAUSED"),
            eq(protocolEvents.subjectId, scheduledLaunchId),
          ),
        )
        .limit(1);
      expect(evt).toBeDefined();
    });

    it("returns 404 when target launch candidate does not exist", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/admin/launches/LC-NONEXISTENT/emergency-pause",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // Verification 1: Ephemeral Dev Token (non-prod vs prod mode)
  // --------------------------------------------------------------------------
  describe("Verification 1: Ephemeral Dev Token", () => {
    it("(a) non-production, ADMIN_API_TOKENS empty: generates ephemeral dev token, printed to log, succeeds on admin call", async () => {
      const originalTokens = env.ADMIN_API_TOKENS;
      const originalNodeEnv = env.NODE_ENV;

      try {
        (env as any).ADMIN_API_TOKENS = undefined;
        (env as any).NODE_ENV = "development";
        resetAllowedAdminTokensCache();

        const tokens = getAllowedAdminTokens();
        const devToken = getEphemeralDevToken();

        expect(devToken).toBeString();
        expect(devToken!.length).toBe(48); // 24 bytes in hex
        expect(tokens.has(devToken!)).toBe(true);

        // Call an admin endpoint with this ephemeral token
        const res = await app.inject({
          method: "POST",
          url: "/api/v1/admin/agent/pause",
          headers: { Authorization: `Bearer ${devToken}` },
        });

        expect(res.statusCode).toBe(200);

        // Resume afterwards
        await app.inject({
          method: "POST",
          url: "/api/v1/admin/agent/resume",
          headers: { Authorization: `Bearer ${devToken}` },
        });
      } finally {
        (env as any).ADMIN_API_TOKENS = "test-admin-suite-token";
        (env as any).NODE_ENV = originalNodeEnv;
        resetAllowedAdminTokensCache();
        validToken = "test-admin-suite-token";
        authHeaders.Authorization = `Bearer ${validToken}`;
      }
    });

    it("(b) production mode, ADMIN_API_TOKENS empty: allowlist is empty, all admin requests rejected with 401", async () => {
      const originalTokens = env.ADMIN_API_TOKENS;
      const originalNodeEnv = env.NODE_ENV;

      try {
        (env as any).ADMIN_API_TOKENS = undefined;
        (env as any).NODE_ENV = "production";
        resetAllowedAdminTokensCache();

        const tokens = getAllowedAdminTokens();
        const devToken = getEphemeralDevToken();

        expect(tokens.size).toBe(0);
        expect(devToken).toBeNull();

        // Any token, including dummy or previously active token, must be rejected with 401
        const res1 = await app.inject({
          method: "POST",
          url: "/api/v1/admin/agent/pause",
          headers: { Authorization: "Bearer any-hypothetical-admin-token" },
        });
        expect(res1.statusCode).toBe(401);

        const res2 = await app.inject({
          method: "POST",
          url: "/api/v1/admin/scan/trigger",
          headers: { Authorization: `Bearer ${validToken}` },
          payload: { kind: "DELTA" },
        });
        expect(res2.statusCode).toBe(401);
      } finally {
        (env as any).ADMIN_API_TOKENS = "test-admin-suite-token";
        (env as any).NODE_ENV = originalNodeEnv;
        resetAllowedAdminTokensCache();
        validToken = "test-admin-suite-token";
        authHeaders.Authorization = `Bearer ${validToken}`;
      }
    });
  });

  // --------------------------------------------------------------------------
  // Verification 2: Double-Click Protection on Scan Trigger
  // --------------------------------------------------------------------------
  describe("Verification 2: Double-Click Protection on Scan Trigger", () => {
    it("deduplicates rapid consecutive triggers for same cycle kind to exactly 1 BullMQ job", async () => {
      const queue = getCycleQueue();
      // Ensure queue is paused and drained before test to prevent race with running workers
      await queue.pause();
      await queue.drain();

      try {
        // Trigger DELTA twice rapidly in parallel
        const [res1, res2] = await Promise.all([
          app.inject({
            method: "POST",
            url: "/api/v1/admin/scan/trigger",
            headers: authHeaders,
            payload: { kind: "DELTA" },
          }),
          app.inject({
            method: "POST",
            url: "/api/v1/admin/scan/trigger",
            headers: authHeaders,
            payload: { kind: "DELTA" },
          }),
        ]);

        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(200);

        const json1 = JSON.parse(res1.body);
        const json2 = JSON.parse(res2.body);

        // Both should return the same deterministic job ID
        expect(json1.data.jobId).toBe(json2.data.jobId);
        expect(json1.data.jobId).toContain("manual-DELTA:");

        // Check BullMQ queue job count for this ID across active, waiting, delayed, and completed
        const jobs = await queue.getJobs(["waiting", "active", "delayed", "completed"]);
        const matchingJobs = jobs.filter((j) => j.id === json1.data.jobId);

        // BullMQ level assert: exactly 1 job queued/processed, duplicate was prevented
        expect(matchingJobs.length).toBe(1);
      } finally {
        await queue.resume();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Verification 3: Integration Test 07 + 10 (Approve -> Schedule -> GET /launches and /launches/:id)
  // --------------------------------------------------------------------------
  describe("Verification 3: Integration Test 07 + 10 (Approve -> Schedule -> GET /launches and /launches/:id)", () => {
    it("approves pairing, schedules launch, and asserts valid Launch presentation shape against protocol-types", async () => {
      // 1. Seed a dedicated fresh pairing candidate
      const integrationPairingId = `pc-admin-int-${randomUUID().slice(0, 8)}`;
      await db.insert(pairingCandidates).values({
        id: integrationPairingId,
        symbol: "NVDA",
        memeSymbol: "$GPU",
        thesis: {
          whyStock: "Accelerating compute demands",
          whyMeme: "Decentralized GPU cluster narrative",
          whyPair: "Direct hardware correlation",
          whyNow: "Q3 earnings momentum",
        },
        components: {
          narrative: 92,
          cultural: 85,
          meme: 88,
          crypto: 80,
          timing: 90,
          stockRelevance: 88,
        },
        pairingScore: 87.2,
        lifecycleState: "PROPOSED",
      });

      // 2. POST /admin/pairings/:id/approve -> lifecycleState becomes CURATED
      const approveRes = await app.inject({
        method: "POST",
        url: `/api/v1/admin/pairings/${integrationPairingId}/approve`,
        headers: authHeaders,
      });
      expect(approveRes.statusCode).toBe(200);
      expect(JSON.parse(approveRes.body).data.lifecycleState).toBe("CURATED");

      // 3. POST /admin/launches/schedule -> creates launch_candidates + 6 launch_cycles rows
      const scheduleRes = await app.inject({
        method: "POST",
        url: "/api/v1/admin/launches/schedule",
        headers: authHeaders,
        payload: { pairingCandidateId: integrationPairingId },
      });
      expect(scheduleRes.statusCode).toBe(201);
      const scheduleJson = JSON.parse(scheduleRes.body);
      const createdLaunchId = scheduleJson.data.id;
      expect(createdLaunchId).toBeDefined();

      // 4. GET /api/v1/launches -> returns array of Launch
      const listRes = await app.inject({
        method: "GET",
        url: "/api/v1/launches",
      });
      expect(listRes.statusCode).toBe(200);
      const listJson = JSON.parse(listRes.body);
      expect(listJson.data).toBeArray();
      expect(listJson.data.length).toBeGreaterThan(0);

      const targetLaunch = listJson.data.find((l: any) => l.cycleId === createdLaunchId);
      expect(targetLaunch).toBeDefined();

      // 5. GET /api/v1/launches/:id -> returns single Launch
      const detailRes = await app.inject({
        method: "GET",
        url: `/api/v1/launches/${createdLaunchId}`,
      });
      expect(detailRes.statusCode).toBe(200);
      const detailJson = JSON.parse(detailRes.body);
      const launch = detailJson.data;

      // 6. Strict validation against Launch type and schema from protocol-types
      const parsed = launchSchema.safeParse(launch);
      expect(parsed.success).toBe(true);

      // Explicit field assertions as requested in user specification:
      expect(launch.cycleId).toBe(createdLaunchId);
      expect(launch.stage).toBe("CANDIDATE_SELECTED");
      expect(launch.readiness).toBe("PENDING"); // mapped from PREPARING
      expect(launch.countdownSeconds).toBeGreaterThan(0); // computed from stageDeadlineAt - now

      // stages array: exactly 6 rows from launch_cycles
      expect(launch.stages.length).toBe(6);
      expect(launch.stages[0].id).toBe("CANDIDATE_SELECTED");
      expect(launch.stages[0].status).toBe("COMPLETE");
      expect(launch.stages[1].id).toBe("NARRATIVE_VALIDATION");
      expect(launch.stages[1].status).toBe("PENDING");

      // policyChecks: computed from checksPassed / checksTotal
      expect(launch.policyChecks.length).toBe(8);
      const passedCount = launch.policyChecks.filter((c: any) => c.status === "PASSED").length;
      expect(passedCount).toBe(0); // newly scheduled starts at 0 checks passed
      expect(launch.policyChecks[0].status).toBe("PENDING");

      // Clean up integration records
      await db.delete(launchCycles).where(eq(launchCycles.launchCandidateId, createdLaunchId));
      await db.delete(launchCandidates).where(eq(launchCandidates.id, createdLaunchId));
      await db.delete(pairingHistory).where(eq(pairingHistory.pairingCandidateId, integrationPairingId));
      await db.delete(pairingCandidates).where(eq(pairingCandidates.id, integrationPairingId));
    });
  });

  afterAll(async () => {
    await db
      .delete(agentConfigVersions)
      .where(eq(agentConfigVersions.createdBy, "OPERATOR"));
  });
});
