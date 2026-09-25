import type { AgentCycleKind } from "@jevo/protocol-types";
import { Worker, type Job } from "bullmq";
import { executeAgentCycle } from "../agent/cycle";
import { logger } from "../observability/logger";
import {
  AGENT_CYCLES_QUEUE_NAME,
  closeCycleQueue,
  getCycleQueue,
  getRedisConnection,
  type AgentCycleJobData,
  type AgentCycleJobResult,
} from "./queues";

export const REPEATABLE_CYCLE_CONFIGS = [
  { kind: "DELTA" as AgentCycleKind, every: 60 * 1000 }, // ~60s
  { kind: "RANKING" as AgentCycleKind, every: 5 * 60 * 1000 }, // ~5min
  { kind: "FULL" as AgentCycleKind, every: 30 * 60 * 1000 }, // ~30min
  { kind: "NARRATIVE" as AgentCycleKind, every: 60 * 60 * 1000 }, // ~hourly
];

let cycleWorker: Worker<AgentCycleJobData, AgentCycleJobResult> | null = null;

/**
 * Registers BullMQ repeatable jobs per Section 9 scan frequencies.
 */
export async function registerRepeatableCycles(): Promise<void> {
  const queue = getCycleQueue();

  logger.info("Registering repeatable cycle jobs in BullMQ scheduler...");

  for (const config of REPEATABLE_CYCLE_CONFIGS) {
    await queue.upsertJobScheduler(
      `scheduled-${config.kind.toLowerCase()}`,
      { every: config.every },
      {
        name: `cycle-${config.kind.toLowerCase()}`,
        data: { kind: config.kind },
        opts: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    );
  }

  logger.info("Repeatable cycle jobs registered successfully");
}

/**
 * Worker processor that executes agent cycles.
 */
export async function processCycleJob(
  job: Job<AgentCycleJobData, AgentCycleJobResult>,
): Promise<AgentCycleJobResult> {
  logger.info({ jobId: job.id, kind: job.data.kind }, "Processing cycle job...");

  const result = await executeAgentCycle(job.data.kind, job.data.options);
  return result;
}

/**
 * Creates and starts the BullMQ cycle worker.
 */
export function startCycleWorker(): Worker<
  AgentCycleJobData,
  AgentCycleJobResult
> {
  if (!cycleWorker) {
    const connection = getRedisConnection();
    cycleWorker = new Worker<AgentCycleJobData, AgentCycleJobResult>(
      AGENT_CYCLES_QUEUE_NAME,
      processCycleJob,
      {
        connection,
        concurrency: 1, // Agent cycles execute with sequential mutual exclusion
      },
    );

    cycleWorker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Cycle job finished processing");
    });

    cycleWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Cycle job processing failed");
    });
  }

  return cycleWorker;
}

/**
 * Cleanly shuts down the cycle worker and queue.
 */
export async function stopCycleWorker(): Promise<void> {
  if (cycleWorker) {
    await cycleWorker.close();
    cycleWorker = null;
  }
  await closeCycleQueue();
}

/**
 * Pauses BullMQ queue and worker using native methods.
 */
export async function pauseAgentCycleQueue(): Promise<void> {
  const queue = getCycleQueue();
  await queue.pause();
  if (cycleWorker) {
    await cycleWorker.pause();
  }
  logger.info("Agent cycle queue & worker paused via operator request");
}

/**
 * Resumes BullMQ queue and worker using native methods.
 */
export async function resumeAgentCycleQueue(): Promise<void> {
  const queue = getCycleQueue();
  await queue.resume();
  if (cycleWorker) {
    cycleWorker.resume();
  }
  logger.info("Agent cycle queue & worker resumed via operator request");
}

/**
 * Reads live paused state directly from BullMQ queue.
 */
export async function isAgentCycleQueuePaused(): Promise<boolean> {
  const queue = getCycleQueue();
  return queue.isPaused();
}

