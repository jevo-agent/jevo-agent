import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  vercelCycleJobSchema,
  vercelLaunchProgressionJobSchema,
} from "@jevo/protocol-types";
import { env } from "../../config/env";
import { executeAgentCycle } from "../../agent/cycle";
import { advanceDueLaunchStages } from "../../jobs/launchProgression";
import { cycleIdForVercelJob } from "../../runtime";
import { formatResponse } from "../envelope";

function isAuthorizedInternalRequest(request: FastifyRequest): boolean {
  const expected = env.VERCEL_INTERNAL_JOB_TOKEN?.trim();
  return Boolean(expected && request.headers["x-jevo-internal-token"] === expected);
}

export const internalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/internal/jobs/agent-cycle", async (request, reply) => {
    if (!isAuthorizedInternalRequest(request)) {
      reply.status(401);
      return { error: "Unauthorized" };
    }

    const parsed = vercelCycleJobSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { error: "Invalid queue payload", issues: parsed.error.issues };
    }

    const result = await executeAgentCycle(parsed.data.kind, {
      forcedCycleId: cycleIdForVercelJob(parsed.data.idempotencyKey),
    });
    return formatResponse(result);
  });

  fastify.post("/internal/jobs/launch-progression", async (request, reply) => {
    if (!isAuthorizedInternalRequest(request)) {
      reply.status(401);
      return { error: "Unauthorized" };
    }

    const parsed = vercelLaunchProgressionJobSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { error: "Invalid queue payload", issues: parsed.error.issues };
    }

    const stages = await advanceDueLaunchStages();
    return formatResponse({
      accepted: true,
      idempotencyKey: parsed.data.idempotencyKey,
      advancedCount: stages.length,
      stages,
    });
  });
};
