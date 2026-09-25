import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { executeAgentCycle } from "../src/agent/cycle";
import { db } from "../src/db/client";
import {
  agentCycles,
  jevDecisions,
  memoryEvents,
  opportunityScores,
  protocolEvents,
  rankHistory,
} from "../src/db/schema";
import {
  closeCycleQueue,
  enqueueCycleJob,
  getCycleQueue,
  getDeterministicJobId,
} from "../src/jobs/queues";

describe("Agent Cycle Orchestration (BACKEND 05)", () => {
  const integrationCycleId = "cycle-integration-test-01";
  const idempotentCycleId = "cycle-idempotent-test-01";
  const crashCycleId = "cycle-crash-test-01";

  const testCycleIds = [
    integrationCycleId,
    idempotentCycleId,
    crashCycleId,
  ];

  beforeAll(async () => {
    // Clean up test data from prior runs if any
    await db.delete(rankHistory).where(inArray(rankHistory.cycleId, testCycleIds));
    await db.delete(opportunityScores).where(inArray(opportunityScores.cycleId, testCycleIds));
    await db.delete(jevDecisions).where(inArray(jevDecisions.cycleId, testCycleIds));
    await db.delete(memoryEvents).where(inArray(memoryEvents.cycleId, testCycleIds));
    await db.delete(protocolEvents).where(inArray(protocolEvents.cycleId, testCycleIds));
    await db.delete(agentCycles).where(inArray(agentCycles.id, testCycleIds));

    // Clear BullMQ test queue
    const queue = getCycleQueue();
    await queue.drain();
  });

  afterAll(async () => {
    // Clean up database test records
    await db.delete(rankHistory).where(inArray(rankHistory.cycleId, testCycleIds));
    await db.delete(opportunityScores).where(inArray(opportunityScores.cycleId, testCycleIds));
    await db.delete(jevDecisions).where(inArray(jevDecisions.cycleId, testCycleIds));
    await db.delete(memoryEvents).where(inArray(memoryEvents.cycleId, testCycleIds));
    await db.delete(protocolEvents).where(inArray(protocolEvents.cycleId, testCycleIds));
    await db.delete(agentCycles).where(inArray(agentCycles.id, testCycleIds));

    // Close BullMQ queue and Redis connection cleanly
    await closeCycleQueue();
  });

  describe("(a) End-to-End Integration", () => {
    it("executes a DELTA cycle end-to-end and writes correct rows to all 4 core tables", async () => {
      const result = await executeAgentCycle("DELTA", {
        forcedCycleId: integrationCycleId,
      });

      expect(result.status).toBe("COMPLETED");
      expect(result.cycleId).toBe(integrationCycleId);
      expect(result.kind).toBe("DELTA");
      expect(result.assetsScanned).toBe(7); // NVDA, TSLA, PLTR, AAPL, GME, AMD, COIN
      expect(result.signalsProcessed).toBeGreaterThan(0);
      expect(result.rankingSummary).toBeDefined();

      // 1. Verify agent_cycles table
      const [cycleRow] = await db
        .select()
        .from(agentCycles)
        .where(eq(agentCycles.id, integrationCycleId));

      expect(cycleRow).toBeDefined();
      expect(cycleRow.status).toBe("COMPLETED");
      expect(cycleRow.kind).toBe("DELTA");
      expect(cycleRow.assetsScanned).toBe(7);
      expect(cycleRow.completedAt).not.toBeNull();

      // 2. Verify jev_decisions table (7 decisions recorded, 1 per asset)
      const decisions = await db
        .select()
        .from(jevDecisions)
        .where(eq(jevDecisions.cycleId, integrationCycleId));

      expect(decisions.length).toBe(7);
      const nvdaDecision = decisions.find((d) => d.symbol === "NVDA");
      expect(nvdaDecision).toBeDefined();
      expect(nvdaDecision!.decision).toBe("PROMOTE");
      expect(nvdaDecision!.confidence).toBe(94);

      // 3. Verify opportunity_scores table (7 rows, scores > 0)
      const scores = await db
        .select()
        .from(opportunityScores)
        .where(eq(opportunityScores.cycleId, integrationCycleId));

      expect(scores.length).toBe(7);
      const nvdaScore = scores.find((s) => s.symbol === "NVDA");
      expect(nvdaScore).toBeDefined();
      expect(nvdaScore!.score).toBeGreaterThan(50);
      expect(nvdaScore!.marketMomentum).toBeGreaterThan(0);
      expect(nvdaScore!.socialVelocity).toBeGreaterThan(0);

      // 4. Verify rank_history table (7 rows, ranked #1 to #7)
      const ranks = await db
        .select()
        .from(rankHistory)
        .where(eq(rankHistory.cycleId, integrationCycleId));

      expect(ranks.length).toBe(7);
      const rankedNumbers = ranks.map((r) => r.currentRank).sort((a, b) => a - b);
      expect(rankedNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);

      // 5. Verify memory_events & protocol_events
      const memories = await db
        .select()
        .from(memoryEvents)
        .where(eq(memoryEvents.cycleId, integrationCycleId));
      expect(memories.length).toBeGreaterThan(0);

      const events = await db
        .select()
        .from(protocolEvents)
        .where(eq(protocolEvents.cycleId, integrationCycleId));
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe("(b) Idempotency & Queue Deduplication", () => {
    it("refuses duplicate jobs with the same deterministic job ID at the BullMQ queue level", async () => {
      const fixedTimestamp = 1790000000000;
      const expectedJobId = getDeterministicJobId("DELTA", fixedTimestamp);
      expect(expectedJobId).toContain("DELTA:");

      // Enqueue Job 1
      const job1 = await enqueueCycleJob("DELTA", {
        timestampMs: fixedTimestamp,
        forcedCycleId: idempotentCycleId,
      });
      expect(job1.id).toBe(expectedJobId);

      // Enqueue Job 2 with identical timestamp (deterministic duplicate)
      const job2 = await enqueueCycleJob("DELTA", {
        timestampMs: fixedTimestamp,
        forcedCycleId: idempotentCycleId,
      });
      expect(job2.id).toBe(expectedJobId);

      // Verify that BullMQ queue holds exactly 1 job with this ID
      const queue = getCycleQueue();
      const waitingJobs = await queue.getJobs(["waiting", "delayed", "active"]);
      const matchingJobs = waitingJobs.filter((j) => j.id === expectedJobId);

      expect(matchingJobs.length).toBe(1);
    });

    it("running the same cycleId twice leaves exactly the same row count across database tables", async () => {
      // Run cycle first time
      await executeAgentCycle("DELTA", {
        forcedCycleId: idempotentCycleId,
      });

      const countDecisionsRun1 = await db
        .select()
        .from(jevDecisions)
        .where(eq(jevDecisions.cycleId, idempotentCycleId));
      expect(countDecisionsRun1.length).toBe(7);

      const countRanksRun1 = await db
        .select()
        .from(rankHistory)
        .where(eq(rankHistory.cycleId, idempotentCycleId));
      expect(countRanksRun1.length).toBe(7);

      // Run cycle second time with the exact same cycleId
      const secondRun = await executeAgentCycle("DELTA", {
        forcedCycleId: idempotentCycleId,
      });

      // Advisory lock & status check or upsert idempotency ensures no duplicates
      const countDecisionsRun2 = await db
        .select()
        .from(jevDecisions)
        .where(eq(jevDecisions.cycleId, idempotentCycleId));
      expect(countDecisionsRun2.length).toBe(7);

      const countRanksRun2 = await db
        .select()
        .from(rankHistory)
        .where(eq(rankHistory.cycleId, idempotentCycleId));
      expect(countRanksRun2.length).toBe(7);
    });
  });

  describe("(c) Crash-Recovery Sanity", () => {
    it("marks cycle as FAILED when a fatal error occurs mid-execution (never left in RUNNING)", async () => {
      // Simulate crash at step 8
      let threwError = false;
      try {
        await executeAgentCycle("FULL", {
          forcedCycleId: crashCycleId,
          simulateCrashAtStep: 8,
        });
      } catch (err: any) {
        threwError = true;
        expect(err.message).toContain("Simulated failure at Step 8");
      }

      expect(threwError).toBe(true);

      // Assert that agent_cycles table row is marked FAILED, not RUNNING or COMPLETED
      const [failedCycle] = await db
        .select()
        .from(agentCycles)
        .where(eq(agentCycles.id, crashCycleId));

      expect(failedCycle).toBeDefined();
      expect(failedCycle.status).toBe("FAILED");
      expect(failedCycle.completedAt).not.toBeNull();
    });
  });
});
