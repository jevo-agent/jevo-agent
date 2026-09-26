import { randomUUID } from "node:crypto";
import type { LaunchStage, ProtocolEvent } from "@jevo/protocol-types";
import { and, eq, ne } from "drizzle-orm";
import { Queue, Worker, type Job } from "bullmq";
import { db } from "../db/client";
import { launchCandidates, launchCycles, protocolEvents } from "../db/schema";
import { publishProtocolEvent } from "../events";
import { logger } from "../observability/logger";
import { getRedisConnection } from "./queues";

export const LAUNCH_PROGRESSION_QUEUE_NAME = "launch-progression";

/**
 * 6-stage lifecycle configuration with timing offsets relative to scheduling time S.
 * Timing per specification:
 *   T-24H = S (completed during initial scheduling)
 *   T-18H = S + 6 hours
 *   T-12H = S + 12 hours
 *   T-06H = S + 18 hours
 *   T-01H = S + 23 hours
 *   T-00  = S + 24 hours
 */
export const LAUNCH_STAGE_SEQUENCE = [
  { stageLabel: "T-24H", stage: "CANDIDATE_SELECTED" as const, offsetMs: 0 },
  { stageLabel: "T-18H", stage: "NARRATIVE_VALIDATION" as const, offsetMs: 6 * 60 * 60 * 1000 },
  { stageLabel: "T-12H", stage: "PAIRING_VALIDATION" as const, offsetMs: 12 * 60 * 60 * 1000 },
  { stageLabel: "T-06H", stage: "CONTRACT_PREPARATION" as const, offsetMs: 18 * 60 * 60 * 1000 },
  { stageLabel: "T-01H", stage: "FINAL_POLICY_CHECK" as const, offsetMs: 23 * 60 * 60 * 1000 },
  { stageLabel: "T-00",  stage: "CONTROLLED_EXECUTION" as const, offsetMs: 24 * 60 * 60 * 1000 },
] as const;

export interface LaunchStageAdvanceResult {
  launchCandidateId: string;
  stageLabel: string;
  previousStage: string;
  newStage: string;
  advancedAt: string;
}

/**
 * Core progression engine: scans all active, non-paused launch cycles,
 * advances overdue stages sequentially in strict order, updates candidate metadata,
 * and publishes LAUNCH_STAGE_ADVANCED events.
 */
export async function advanceDueLaunchStages(
  currentTime: Date = new Date(),
): Promise<LaunchStageAdvanceResult[]> {
  const results: LaunchStageAdvanceResult[] = [];

  // Rule 5: SKIP total launch_candidates where readiness='PAUSED'
  const candidates = await db
    .select()
    .from(launchCandidates)
    .where(ne(launchCandidates.readiness, "PAUSED"));

  if (candidates.length === 0) {
    return results;
  }

  for (const candidate of candidates) {
    if (candidate.readiness === "PAUSED") {
      continue;
    }

    // Fetch cycle rows to determine scheduling time S from T-24H completedAt
    const initialCycleRows = await db
      .select()
      .from(launchCycles)
      .where(eq(launchCycles.launchCandidateId, candidate.id));

    const t24 = initialCycleRows.find((r) => r.stageLabel === "T-24H");
    const scheduledTime = t24?.completedAt
      ? new Date(t24.completedAt).getTime()
      : new Date(candidate.stageDeadlineAt).getTime() - 6 * 60 * 60 * 1000;

    // Advance stages sequentially in strict order (never skipping intermediate stages)
    while (true) {
      const cycleRows = await db
        .select()
        .from(launchCycles)
        .where(eq(launchCycles.launchCandidateId, candidate.id));

      // Find the first stage in sequence that is PENDING
      let nextStageMeta: (typeof LAUNCH_STAGE_SEQUENCE)[number] | null = null;
      let pendingRow: (typeof cycleRows)[0] | null = null;
      let nextStageIndex = -1;

      for (let i = 1; i < LAUNCH_STAGE_SEQUENCE.length; i++) {
        const meta = LAUNCH_STAGE_SEQUENCE[i];
        const row = cycleRows.find((r) => r.stageLabel === meta.stageLabel);
        if (row && row.status === "PENDING") {
          nextStageMeta = meta;
          pendingRow = row;
          nextStageIndex = i;
          break;
        }
      }

      // No pending stage left
      if (!nextStageMeta || !pendingRow) {
        break;
      }

      // Check if deadline for this stage has passed
      const stageDeadlineMs = scheduledTime + nextStageMeta.offsetMs;
      if (currentTime.getTime() < stageDeadlineMs) {
        break;
      }

      // Calculate next stage deadline for candidate countdown
      let nextDeadlineAt: Date;
      if (nextStageIndex + 1 < LAUNCH_STAGE_SEQUENCE.length) {
        nextDeadlineAt = new Date(scheduledTime + LAUNCH_STAGE_SEQUENCE[nextStageIndex + 1].offsetMs);
      } else {
        nextDeadlineAt = new Date(stageDeadlineMs);
      }

      // Rule 2: Atomic update with WHERE status='PENDING' (concurrency safety)
      const updatedRows = await db
        .update(launchCycles)
        .set({
          status: "COMPLETE",
          completedAt: currentTime,
        })
        .where(
          and(
            eq(launchCycles.id, pendingRow.id),
            eq(launchCycles.status, "PENDING"),
          ),
        )
        .returning();

      // If 0 rows updated, another concurrent process already handled it -> no-op cleanly
      if (updatedRows.length === 0) {
        break;
      }

      const previousStage = candidate.stage;
      const newStage = nextStageMeta.stage;

      const candidateUpdates: Partial<typeof launchCandidates.$inferInsert> = {
        stage: newStage,
        stageDeadlineAt: nextDeadlineAt,
      };

      // Rule 3: Transisi ke T-01H ("Final Policy Check") -> checksPassed = checksTotal (8/8)
      if (nextStageMeta.stageLabel === "T-01H") {
        candidateUpdates.checksPassed = candidate.checksTotal;
      }

      // Rule 4: Transisi ke T-00 ("Launch via Pons") -> readiness = 'READY'
      // CRITICAL: transactionStatus is intentionally untouched and preserved at 'NOT_SUBMITTED'
      if (nextStageMeta.stageLabel === "T-00") {
        candidateUpdates.readiness = "READY";
      }

      await db
        .update(launchCandidates)
        .set(candidateUpdates)
        .where(eq(launchCandidates.id, candidate.id));

      // Rule 6: Publish event LAUNCH_STAGE_ADVANCED (publish-after-commit)
      const eventId = `pe-stage-${randomUUID()}`;
      const payload = {
        launchCandidateId: candidate.id,
        stageLabel: nextStageMeta.stageLabel,
        newStage,
      };

      const protocolEvent: ProtocolEvent = {
        eventId,
        eventType: "LAUNCH_STAGE_ADVANCED",
        cycleId: null,
        subjectType: "launch",
        subjectId: candidate.id,
        payload,
        schemaVersion: 1,
        actor: "JEVO_AGENT",
        createdAt: currentTime.toISOString(),
      };

      await db.insert(protocolEvents).values({
        eventId,
        eventType: "LAUNCH_STAGE_ADVANCED",
        cycleId: null,
        subjectType: "launch",
        subjectId: candidate.id,
        payload,
        schemaVersion: 1,
        actor: "JEVO_AGENT",
        createdAt: currentTime,
      });

      await publishProtocolEvent(protocolEvent);

      logger.info(
        {
          launchCandidateId: candidate.id,
          stageLabel: nextStageMeta.stageLabel,
          newStage,
        },
        "Advanced launch stage successfully",
      );

      results.push({
        launchCandidateId: candidate.id,
        stageLabel: nextStageMeta.stageLabel,
        previousStage,
        newStage,
        advancedAt: currentTime.toISOString(),
      });

      // Update in-memory candidate stage to reflect progression for next iteration
      candidate.stage = newStage;
      if (candidateUpdates.checksPassed !== undefined) {
        candidate.checksPassed = candidateUpdates.checksPassed;
      }
      if (candidateUpdates.readiness !== undefined) {
        candidate.readiness = candidateUpdates.readiness;
      }
    }
  }

  return results;
}

let launchProgressionQueue: Queue | null = null;
let launchProgressionWorker: Worker | null = null;

export function getLaunchProgressionQueue(): Queue {
  if (!launchProgressionQueue) {
    const connection = getRedisConnection();
    launchProgressionQueue = new Queue(LAUNCH_PROGRESSION_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }
  return launchProgressionQueue;
}

export async function closeLaunchProgressionQueue(): Promise<void> {
  if (launchProgressionQueue) {
    await launchProgressionQueue.close();
    launchProgressionQueue = null;
  }
}

/**
 * Registers BullMQ repeatable scheduler for launch stage progression running every 60s.
 */
export async function registerLaunchProgressionScheduler(): Promise<void> {
  const queue = getLaunchProgressionQueue();
  logger.info("Registering launch stage auto-progression job in BullMQ scheduler...");

  await queue.upsertJobScheduler(
    "scheduled-launch-progression",
    { every: 60 * 1000 }, // 60s
    {
      name: "launch-stage-progression",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    },
  );

  logger.info("Launch stage auto-progression scheduler registered successfully (every 60s)");
}

/**
 * Starts BullMQ worker for launch stage auto-progression.
 */
export function startLaunchProgressionWorker(): Worker {
  if (!launchProgressionWorker) {
    const connection = getRedisConnection();
    launchProgressionWorker = new Worker(
      LAUNCH_PROGRESSION_QUEUE_NAME,
      async (job: Job) => {
        logger.info({ jobId: job.id }, "Processing launch stage auto-progression job tick...");
        const results = await advanceDueLaunchStages();
        return { advancedCount: results.length, stages: results };
      },
      {
        connection,
        concurrency: 1,
      },
    );

    launchProgressionWorker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Launch stage auto-progression job completed");
    });

    launchProgressionWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Launch stage auto-progression job failed");
    });
  }
  return launchProgressionWorker;
}

export async function stopLaunchProgressionWorker(): Promise<void> {
  if (launchProgressionWorker) {
    await launchProgressionWorker.close();
    launchProgressionWorker = null;
  }
  await closeLaunchProgressionQueue();
}
