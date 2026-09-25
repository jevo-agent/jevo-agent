import type { AgentCycleKind } from "@jevo/protocol-types";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { CycleExecutionOptions, CycleExecutionResult } from "../agent/cycle";
import { env } from "../config/env";
import { logger } from "../observability/logger";

export const AGENT_CYCLES_QUEUE_NAME = "agent-cycles";

export interface AgentCycleJobData {
  kind: AgentCycleKind;
  options?: CycleExecutionOptions;
}

export type AgentCycleJobResult = CycleExecutionResult;

const INTERVAL_MS: Record<string, number> = {
  DELTA: 60 * 1000, // 60s
  RANKING: 5 * 60 * 1000, // 5m
  FULL: 30 * 60 * 1000, // 30m
  NARRATIVE: 60 * 60 * 1000, // 1h
};

/**
 * Computes a deterministic job ID: `${cycleKind}:${flooredTimestampToInterval}`
 * Section 16 Layer 1 Idempotency: BullMQ natively rejects a second job with an ID
 * already queued/active, making scheduler misfires or duplicate triggers an automatic no-op.
 */
export function getDeterministicJobId(
  cycleKind: AgentCycleKind,
  timestampMs: number = Date.now(),
): string {
  const kindUpper = cycleKind.toUpperCase();
  const interval = INTERVAL_MS[kindUpper] ?? 60 * 1000;
  const floored = Math.floor(timestampMs / interval) * interval;
  return `${kindUpper}:${floored}:cycle`;
}

let redisConnection: IORedis | null = null;
let cycleQueue: Queue<AgentCycleJobData, AgentCycleJobResult> | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    redisConnection.on("error", (err) => {
      logger.error({ err }, "Redis connection error in agent queue");
    });
  }
  return redisConnection;
}

export function getCycleQueue(): Queue<AgentCycleJobData, AgentCycleJobResult> {
  if (!cycleQueue) {
    const connection = getRedisConnection();
    cycleQueue = new Queue<AgentCycleJobData, AgentCycleJobResult>(
      AGENT_CYCLES_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 100,
          },
        },
      },
    );
  }
  return cycleQueue;
}

/**
 * Adds an agent cycle job to the BullMQ queue with a deterministic job ID.
 * If a job with this deterministic ID already exists in waiting/active state,
 * BullMQ rejects/ignores duplicate insertion without running it twice.
 */
export async function enqueueCycleJob(
  cycleKind: AgentCycleKind,
  options?: CycleExecutionOptions & {
    customJobId?: string;
    timestampMs?: number;
  },
) {
  const jobId =
    options?.customJobId ??
    getDeterministicJobId(cycleKind, options?.timestampMs);
  const queue = getCycleQueue();

  logger.info({ cycleKind, jobId }, "Enqueuing cycle job to BullMQ queue...");

  const job = await queue.add(
    `cycle-${cycleKind.toLowerCase()}`,
    {
      kind: cycleKind,
      options,
    },
    {
      jobId,
    },
  );

  return job;
}

/**
 * Cleanly closes the queue and Redis connection.
 */
export async function closeCycleQueue(): Promise<void> {
  if (cycleQueue) {
    await cycleQueue.close();
    cycleQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
