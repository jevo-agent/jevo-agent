import { randomUUID } from "node:crypto";
import { db } from "../db/client";
import { providerRuns } from "../db/schema";
import { logger } from "../observability/logger";

export type ProviderRunStatus = "HEALTHY" | "DEGRADED" | "DOWN";

export interface LogProviderRunParams {
  provider: string;
  status: ProviderRunStatus;
  latencyMs: number;
  error?: string | null;
}

export async function logProviderRun(params: LogProviderRunParams): Promise<void> {
  try {
    await db.insert(providerRuns).values({
      id: `run-${randomUUID()}`,
      provider: params.provider,
      status: params.status,
      latencyMs: Math.max(0, Math.round(params.latencyMs)),
      error: params.error ?? null,
      ranAt: new Date(),
    });
  } catch (dbErr) {
    // Never let logging to provider_runs crash the main application, but log it
    logger.warn({ dbErr, provider: params.provider }, "Failed to write to provider_runs");
  }
}

export async function withProviderHealth<T>(
  providerName: string,
  operation: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await operation();
    const latencyMs = performance.now() - startTime;
    const status: ProviderRunStatus = latencyMs > 3000 ? "DEGRADED" : "HEALTHY";

    await logProviderRun({
      provider: providerName,
      status,
      latencyMs,
      error: null,
    });

    return result;
  } catch (error) {
    const latencyMs = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logProviderRun({
      provider: providerName,
      status: "DOWN",
      latencyMs,
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Wraps any provider instance in a Proxy that intercepts all async method calls
 * and records latency, status, and error states directly into `provider_runs`.
 */
export function wrapProviderWithHealthLogging<T extends object>(
  providerName: string,
  provider: T,
): T {
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const origMethod = Reflect.get(target, prop, receiver);
      if (typeof origMethod !== "function") {
        return origMethod;
      }

      return async function (...args: unknown[]) {
        return withProviderHealth(providerName, () =>
          origMethod.apply(target, args),
        );
      };
    },
  });
}
