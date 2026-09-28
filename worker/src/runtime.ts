/**
 * Runtime boundary used to keep the long-lived local worker separate from
 * Vercel Functions. Vercel sets VERCEL=1 for every deployed function.
 */
export function isVercelRuntime(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL === "1" || Boolean(env.VERCEL_ENV);
}

export function shouldStartPersistentWorkers(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !isVercelRuntime(env);
}

export const CYCLE_INTERVAL_MS = {
  DELTA: 60_000,
  RANKING: 5 * 60_000,
  FULL: 30 * 60_000,
  NARRATIVE: 60 * 60_000,
} as const;

export type RuntimeCycleKind = keyof typeof CYCLE_INTERVAL_MS;

export function cycleIdempotencyKey(
  kind: RuntimeCycleKind,
  nowMs = Date.now(),
  source: "cron" | "admin" = "cron",
): string {
  const bucket = Math.floor(nowMs / CYCLE_INTERVAL_MS[kind]) * CYCLE_INTERVAL_MS[kind];
  return `jevo:${source}:${kind}:${bucket}`;
}

export function launchIdempotencyKey(nowMs = Date.now()): string {
  const bucket = Math.floor(nowMs / 60_000) * 60_000;
  return `jevo:cron:launch:${bucket}`;
}

export function cycleIdForVercelJob(idempotencyKey: string): string {
  return `vercel-${idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
