import { send } from "@vercel/queue";
import type {
  AgentCycleKind,
  VercelCycleJob,
  VercelLaunchProgressionJob,
} from "@jevo/protocol-types";
import { vercelCycleJobSchema, vercelLaunchProgressionJobSchema } from "@jevo/protocol-types";
import type { CycleExecutionOptions } from "../agent/cycle";
import { enqueueCycleJob } from "./queues";
import {
  cycleIdForVercelJob,
  cycleIdempotencyKey,
  isVercelRuntime,
  launchIdempotencyKey,
} from "../runtime";

export const VERCEL_CYCLE_TOPIC = "jevo-agent-cycles";
export const VERCEL_LAUNCH_TOPIC = "jevo-launch-progression";

export interface RuntimeJobHandle {
  id: string;
  transport: "vercel-queue" | "bullmq";
}

export async function enqueueVercelCycle(
  kind: AgentCycleKind,
  source: "cron" | "admin",
  nowMs = Date.now(),
): Promise<RuntimeJobHandle> {
  const payload: VercelCycleJob = {
    kind,
    source,
    idempotencyKey: cycleIdempotencyKey(kind, nowMs, source),
  };
  const parsed = vercelCycleJobSchema.parse(payload);
  const result = await send(VERCEL_CYCLE_TOPIC, parsed, {
    idempotencyKey: parsed.idempotencyKey,
  });
  return { id: result.messageId ?? parsed.idempotencyKey, transport: "vercel-queue" };
}

export async function enqueueVercelLaunchProgression(
  nowMs = Date.now(),
): Promise<RuntimeJobHandle> {
  const payload: VercelLaunchProgressionJob = {
    source: "cron",
    idempotencyKey: launchIdempotencyKey(nowMs),
  };
  const parsed = vercelLaunchProgressionJobSchema.parse(payload);
  const result = await send(VERCEL_LAUNCH_TOPIC, parsed, {
    idempotencyKey: parsed.idempotencyKey,
  });
  return { id: result.messageId ?? parsed.idempotencyKey, transport: "vercel-queue" };
}

/**
 * Local development keeps its BullMQ transport; Vercel uses durable Queue.
 * Both transports eventually invoke the same executeAgentCycle function.
 */
export async function enqueueCycleForRuntime(
  kind: AgentCycleKind,
  options?: CycleExecutionOptions & { isManual?: boolean; timestampMs?: number },
): Promise<RuntimeJobHandle> {
  if (isVercelRuntime()) {
    return enqueueVercelCycle(kind, options?.isManual ? "admin" : "cron", options?.timestampMs);
  }

  const job = await enqueueCycleJob(kind, options);
  return { id: String(job.id), transport: "bullmq" };
}

export { cycleIdForVercelJob } from "../runtime";
