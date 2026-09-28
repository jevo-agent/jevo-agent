import { z } from "zod";

import type { AgentCycleKind } from "../types";

/**
 * Payloads exchanged by the Vercel Cron/Queue runtime boundary.
 *
 * This is deliberately smaller than CycleExecutionOptions: provider and
 * engine instances never cross a queue boundary. The worker reconstructs its
 * canonical dependencies when it receives the message.
 */
export const vercelCycleJobSchema = z.object({
  kind: z.enum(["DELTA", "RANKING", "FULL", "NARRATIVE"]),
  idempotencyKey: z.string().min(1),
  source: z.enum(["cron", "admin"]),
});

export const vercelLaunchProgressionJobSchema = z.object({
  idempotencyKey: z.string().min(1),
  source: z.enum(["cron"]),
});

export type VercelCycleJob = z.infer<typeof vercelCycleJobSchema> & {
  kind: AgentCycleKind;
};
export type VercelLaunchProgressionJob = z.infer<
  typeof vercelLaunchProgressionJobSchema
>;
