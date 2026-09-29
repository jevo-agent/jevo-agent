import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  assets,
  launchCandidates,
  launchCycles,
  pairingCandidates,
  protocolEvents,
} from "../src/db/schema";
import { seedAssets } from "../src/db/seed";
import {
  advanceDueLaunchStages,
  closeLaunchProgressionQueue,
  getLaunchProgressionQueue,
  LAUNCH_STAGE_SEQUENCE,
  startLaunchProgressionWorker,
  stopLaunchProgressionWorker,
} from "../src/jobs/launchProgression";
import { closeEventBus } from "../src/events";

describe("Launch Stage Auto-Progression (Job & Transitions)", () => {
  const testSymbol = "NVDA";
  let basePairingId: string;

  beforeAll(async () => {
    await seedAssets();

    // Ensure a pairing candidate exists for FK
    basePairingId = `pc-prog-test-${randomUUID().slice(0, 8)}`;
    await db.insert(pairingCandidates).values({
      id: basePairingId,
      symbol: testSymbol,
      memeSymbol: "TESTMEME",
      thesis: {
        whyStock: "Stock momentum",
        whyMeme: "Meme momentum",
        whyPair: "Pair thesis",
        whyNow: "Right now",
      },
      components: {
        narrative: 85,
        cultural: 80,
        meme: 75,
        crypto: 70,
        timing: 90,
        stockRelevance: 88,
      },
      pairingScore: 84.5,
      lifecycleState: "LAUNCH_CANDIDATE",
    });
  });

  const createdLaunchIds: string[] = [];
  const createdPairingIds: string[] = [];

  afterAll(async () => {
    await stopLaunchProgressionWorker();
    await closeLaunchProgressionQueue();
    await closeEventBus();

    if (createdLaunchIds.length > 0) {
      for (const id of createdLaunchIds) {
        await db.delete(launchCycles).where(eq(launchCycles.launchCandidateId, id));
        await db.delete(launchCandidates).where(eq(launchCandidates.id, id));
        await db.delete(protocolEvents).where(eq(protocolEvents.subjectId, id));
      }
    }
    if (createdPairingIds.length > 0) {
      for (const pid of createdPairingIds) {
        await db.delete(pairingCandidates).where(eq(pairingCandidates.id, pid));
      }
    }
    await db.delete(pairingCandidates).where(eq(pairingCandidates.id, basePairingId));
  });

  // Helper to create a test launch candidate with 6 checklist cycles
  async function seedTestLaunch(options: {
    id?: string;
    scheduledAt: Date;
    readiness?: "PREPARING" | "READY" | "PAUSED";
    completedStages?: string[]; // e.g. ["T-30H"]
    checksPassed?: number;
    checksTotal?: number;
    transactionStatus?: "NOT_SUBMITTED";
  }) {
    const launchId = options.id || `LC-TEST-${randomUUID().slice(0, 8).toUpperCase()}`;
    const pairingId = `pc-launch-${randomUUID().slice(0, 8)}`;
    const readiness = options.readiness || "PREPARING";
    const completedStages = new Set(options.completedStages || ["T-30H"]);
    const checksPassed = options.checksPassed ?? 0;
    const checksTotal = options.checksTotal ?? 8;
    const transactionStatus = options.transactionStatus || "NOT_SUBMITTED";

    createdLaunchIds.push(launchId);
    createdPairingIds.push(pairingId);

    await db.insert(pairingCandidates).values({
      id: pairingId,
      symbol: testSymbol,
      memeSymbol: "TESTMEME",
      thesis: {
        whyStock: "Stock momentum",
        whyMeme: "Meme momentum",
        whyPair: "Pair thesis",
        whyNow: "Right now",
      },
      components: {
        narrative: 85,
        cultural: 80,
        meme: 75,
        crypto: 70,
        timing: 90,
        stockRelevance: 88,
      },
      pairingScore: 84.5,
      lifecycleState: "LAUNCH_CANDIDATE",
    });

    // Insert launch candidate
    await db.insert(launchCandidates).values({
      id: launchId,
      pairingCandidateId: pairingId,
      stage: "CANDIDATE_SELECTED",
      readiness,
      checksPassed,
      checksTotal,
      stageDeadlineAt: new Date(options.scheduledAt.getTime() + 7.5 * 60 * 60 * 1000),
      transactionStatus,
    });

    // Insert 6 cycle stages
    await db.insert(launchCycles).values(
      LAUNCH_STAGE_SEQUENCE.map((s, idx) => ({
        id: `lc-stage-${launchId}-${idx + 1}`,
        launchCandidateId: launchId,
        stageLabel: s.stageLabel,
        description: `Stage description for ${s.stageLabel}`,
        status: completedStages.has(s.stageLabel) ? ("COMPLETE" as const) : ("PENDING" as const),
        completedAt: completedStages.has(s.stageLabel) ? options.scheduledAt : null,
      })),
    );

    return launchId;
  }

  it("seeds launch with overdue deadline, asserts stage flips COMPLETE and emits LAUNCH_STAGE_ADVANCED", async () => {
    // S was 8 hours ago -> T-22H30 (+7.5h) deadline has passed, T-15H (+15h) has not
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      completedStages: ["T-30H"],
    });

    const results = await advanceDueLaunchStages(now);

    const match = results.find((r) => r.launchCandidateId === launchId);
    expect(match).toBeDefined();
    expect(match?.stageLabel).toBe("T-22H30");
    expect(match?.newStage).toBe("NARRATIVE_VALIDATION");

    // Check DB cycle row
    const [t22Row] = await db
      .select()
      .from(launchCycles)
      .where(and(eq(launchCycles.launchCandidateId, launchId), eq(launchCycles.stageLabel, "T-22H30")));
    expect(t22Row.status).toBe("COMPLETE");
    expect(t22Row.completedAt).not.toBeNull();

    // Check DB candidate row
    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, launchId));
    expect(candidate.stage).toBe("NARRATIVE_VALIDATION");
    // T-22H30 is milestone only, checksPassed remains untouched at 0
    expect(candidate.checksPassed).toBe(0);

    // Verify protocol event LAUNCH_STAGE_ADVANCED
    const events = await db
      .select()
      .from(protocolEvents)
      .where(and(eq(protocolEvents.subjectId, launchId), eq(protocolEvents.eventType, "LAUNCH_STAGE_ADVANCED")));
    expect(events.length).toBeGreaterThanOrEqual(1);
    const eventPayload = events[events.length - 1].payload as Record<string, unknown>;
    expect(eventPayload.stageLabel).toBe("T-22H30");
    expect(eventPayload.newStage).toBe("NARRATIVE_VALIDATION");
  });

  it("asserts transition to T-01H15 sets checksPassed = checksTotal (8/8)", async () => {
    // S was 29 hours ago -> T-01H15 (+28.75h) has passed, T-00 (+30h) has not
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 29 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      completedStages: ["T-30H", "T-22H30", "T-15H", "T-07H30"],
      checksPassed: 0,
      checksTotal: 8,
    });

    const results = await advanceDueLaunchStages(now);

    const match = results.find(
      (r) => r.launchCandidateId === launchId && r.stageLabel === "T-01H15",
    );
    expect(match).toBeDefined();
    expect(match?.newStage).toBe("FINAL_POLICY_CHECK");

    // Assert launch_candidates checksPassed updated to 8/8
    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, launchId));
    expect(candidate.checksPassed).toBe(8);
    expect(candidate.checksPassed).toBe(candidate.checksTotal);
    expect(candidate.stage).toBe("FINAL_POLICY_CHECK");
  });

  it("asserts transition to T-00 sets readiness='READY' while transactionStatus STRICTLY remains 'NOT_SUBMITTED'", async () => {
    // S was 30.5 hours ago -> T-00 (+30h) has passed
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 30.5 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      completedStages: ["T-30H", "T-22H30", "T-15H", "T-07H30", "T-01H15"],
      checksPassed: 8,
      checksTotal: 8,
      readiness: "PREPARING",
      transactionStatus: "NOT_SUBMITTED",
    });

    const results = await advanceDueLaunchStages(now);

    const match = results.find(
      (r) => r.launchCandidateId === launchId && r.stageLabel === "T-00",
    );
    expect(match).toBeDefined();
    expect(match?.newStage).toBe("CONTROLLED_EXECUTION");

    // Check DB cycle row for T-00
    const [t00Row] = await db
      .select()
      .from(launchCycles)
      .where(and(eq(launchCycles.launchCandidateId, launchId), eq(launchCycles.stageLabel, "T-00")));
    expect(t00Row.status).toBe("COMPLETE");

    // Check DB candidate row: readiness must be 'READY', and transactionStatus must STRICTLY be 'NOT_SUBMITTED'
    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, launchId));

    expect(candidate.stage).toBe("CONTROLLED_EXECUTION");
    expect(candidate.readiness).toBe("READY");
    // CRITICAL: Zero submission calls, zero transaction status modification
    expect(candidate.transactionStatus).toBe("NOT_SUBMITTED");
  });

  it("asserts launch with readiness='PAUSED' is skipped completely even when deadline is far overdue", async () => {
    // S was 48 hours ago, well past all stages, but readiness='PAUSED'
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      readiness: "PAUSED",
      completedStages: ["T-30H"],
    });

    const results = await advanceDueLaunchStages(now);

    // No progression for this paused candidate
    const matches = results.filter((r) => r.launchCandidateId === launchId);
    expect(matches.length).toBe(0);

    // All pending stages remain PENDING
    const stages = await db
      .select()
      .from(launchCycles)
      .where(eq(launchCycles.launchCandidateId, launchId));

    const pendingStages = stages.filter((s) => s.status === "PENDING");
    expect(pendingStages.length).toBe(5); // T-22H30, T-15H, T-07H30, T-01H15, T-00 all still PENDING

    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, launchId));
    expect(candidate.stage).toBe("CANDIDATE_SELECTED");
    expect(candidate.readiness).toBe("PAUSED");
  });

  it("runs job twice in succession, asserting stage does not advance twice or duplicate events", async () => {
    // S was 8 hours ago -> only T-22H30 is overdue
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      completedStages: ["T-30H"],
    });

    // 1st run
    const firstRunResults = await advanceDueLaunchStages(now);
    const firstMatch = firstRunResults.filter((r) => r.launchCandidateId === launchId);
    expect(firstMatch.length).toBe(1);
    expect(firstMatch[0].stageLabel).toBe("T-22H30");

    // Count events after 1st run
    const eventsAfterFirstRun = await db
      .select()
      .from(protocolEvents)
      .where(and(eq(protocolEvents.subjectId, launchId), eq(protocolEvents.eventType, "LAUNCH_STAGE_ADVANCED")));
    expect(eventsAfterFirstRun.length).toBe(1);

    // 2nd run immediately at the same simulated time
    const secondRunResults = await advanceDueLaunchStages(now);
    const secondMatch = secondRunResults.filter((r) => r.launchCandidateId === launchId);
    // Must be 0 rows advanced (clean no-op)
    expect(secondMatch.length).toBe(0);

    // Events count must NOT increase
    const eventsAfterSecondRun = await db
      .select()
      .from(protocolEvents)
      .where(and(eq(protocolEvents.subjectId, launchId), eq(protocolEvents.eventType, "LAUNCH_STAGE_ADVANCED")));
    expect(eventsAfterSecondRun.length).toBe(1);
  });

  it("advances multiple overdue checkpoints one-by-one in strict sequential order", async () => {
    // S was 24 hours ago -> T-22H30 (+7.5h), T-15H (+15h), T-07H30 (+22.5h) are all overdue, T-01H15 (+28.75h) is NOT
    const now = new Date();
    const scheduledAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const launchId = await seedTestLaunch({
      scheduledAt,
      completedStages: ["T-30H"],
    });

    const results = await advanceDueLaunchStages(now);
    const candidateResults = results.filter((r) => r.launchCandidateId === launchId);

    // Exactly 3 stages advanced
    expect(candidateResults.length).toBe(3);
    expect(candidateResults[0].stageLabel).toBe("T-22H30");
    expect(candidateResults[1].stageLabel).toBe("T-15H");
    expect(candidateResults[2].stageLabel).toBe("T-07H30");

    // Candidate ends up at CONTRACT_PREPARATION
    const [candidate] = await db
      .select()
      .from(launchCandidates)
      .where(eq(launchCandidates.id, launchId));
    expect(candidate.stage).toBe("CONTRACT_PREPARATION");

    // Check remaining stages
    const [t01Row] = await db
      .select()
      .from(launchCycles)
      .where(and(eq(launchCycles.launchCandidateId, launchId), eq(launchCycles.stageLabel, "T-01H15")));
    expect(t01Row.status).toBe("PENDING");
  });
});
