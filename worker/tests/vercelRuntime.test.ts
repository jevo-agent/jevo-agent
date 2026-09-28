import { describe, expect, it } from "bun:test";
import {
  cycleIdForVercelJob,
  cycleIdempotencyKey,
  isVercelRuntime,
  launchIdempotencyKey,
  shouldStartPersistentWorkers,
} from "../src/runtime";
import {
  vercelCycleJobSchema,
  vercelLaunchProgressionJobSchema,
} from "@jevo/protocol-types";

describe("Vercel runtime boundaries", () => {
  it("never starts persistent workers in a Vercel Function", () => {
    expect(isVercelRuntime({ VERCEL: "1" })).toBe(true);
    expect(shouldStartPersistentWorkers({ VERCEL: "1" })).toBe(false);
    expect(shouldStartPersistentWorkers({ NODE_ENV: "development" })).toBe(true);
  });

  it("maps cadence kinds to deterministic queue idempotency buckets", () => {
    const now = Date.UTC(2026, 0, 1, 0, 7, 13);
    expect(cycleIdempotencyKey("DELTA", now)).toBe("jevo:cron:DELTA:1767226020000");
    expect(cycleIdempotencyKey("RANKING", now)).toBe("jevo:cron:RANKING:1767225900000");
    expect(cycleIdempotencyKey("FULL", now)).toBe("jevo:cron:FULL:1767225600000");
    expect(cycleIdempotencyKey("NARRATIVE", now)).toBe("jevo:cron:NARRATIVE:1767225600000");
    expect(launchIdempotencyKey(now)).toBe("jevo:cron:launch:1767226020000");
  });

  it("validates queue payloads and derives stable cycle IDs", () => {
    const payload = {
      kind: "DELTA",
      source: "admin",
      idempotencyKey: "jevo:admin:DELTA:1767226020000",
    } as const;
    expect(vercelCycleJobSchema.parse(payload)).toEqual(payload);
    expect(vercelCycleJobSchema.safeParse({ ...payload, kind: "UNKNOWN" }).success).toBe(false);
    expect(cycleIdForVercelJob(payload.idempotencyKey)).toBe(
      "vercel-jevo-admin-DELTA-1767226020000",
    );

    const launch = { source: "cron", idempotencyKey: "jevo:cron:launch:1" } as const;
    expect(vercelLaunchProgressionJobSchema.parse(launch)).toEqual(launch);
  });
});
