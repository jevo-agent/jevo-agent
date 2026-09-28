import { handleCallback, send, type RetryHandler } from "@vercel/queue";
import {
  vercelCycleJobSchema,
  vercelLaunchProgressionJobSchema,
  type VercelCycleJob,
  type VercelLaunchProgressionJob,
} from "@jevo/protocol-types";

export { handleCallback, send };

/**
 * Queue delivery is at-least-once. Retry transient worker/network failures
 * with bounded backoff, then acknowledge a poison message so it cannot loop
 * forever. The worker cycle itself remains idempotent via its canonical key.
 */
export const retryQueueDelivery: RetryHandler = (_error, metadata) => {
  if (metadata.deliveryCount >= 5) {
    return { acknowledge: true };
  }

  return { afterSeconds: Math.min(300, 2 ** metadata.deliveryCount * 5) };
};

function workerBaseUrl(): string {
  const configured =
    process.env.JEVO_API_SERVICE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return configured.replace(/\/$/, "").replace(/\/api\/v1$/, "");
}

export async function dispatchCycleToWorker(payload: unknown): Promise<void> {
  const parsed = vercelCycleJobSchema.parse(payload);
  await dispatchToWorker("agent-cycle", parsed);
}

export async function dispatchLaunchToWorker(payload: unknown): Promise<void> {
  const parsed = vercelLaunchProgressionJobSchema.parse(payload);
  await dispatchToWorker("launch-progression", parsed);
}

async function dispatchToWorker(
  job: "agent-cycle" | "launch-progression",
  payload: VercelCycleJob | VercelLaunchProgressionJob,
): Promise<void> {
  const token = process.env.VERCEL_INTERNAL_JOB_TOKEN?.trim();
  if (!token) {
    throw new Error("VERCEL_INTERNAL_JOB_TOKEN is required by the Queue consumer");
  }

  const response = await fetch(`${workerBaseUrl()}/api/v1/internal/jobs/${job}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-jevo-internal-token": token,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Worker queue dispatch failed with HTTP ${response.status}`);
  }
}
