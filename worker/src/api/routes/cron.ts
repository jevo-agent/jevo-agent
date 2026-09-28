import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { AgentCycleKind } from "@jevo/protocol-types";
import { env } from "../../config/env";
import {
  enqueueCycleForRuntime,
  enqueueVercelLaunchProgression,
} from "../../jobs/vercelQueue";
import { formatResponse } from "../envelope";

function isAuthorizedCronRequest(request: FastifyRequest): boolean {
  if (env.NODE_ENV !== "production") return true;
  const expected = env.CRON_SECRET?.trim();
  return Boolean(expected && request.headers.authorization === `Bearer ${expected}`);
}

function cronPath(kind: AgentCycleKind) {
  return `/api/cron/jevo/${kind.toLowerCase()}`;
}

export const cronRoutes: FastifyPluginAsync = async (fastify) => {
  const enqueueCycle = (kind: AgentCycleKind) => async (request: FastifyRequest, reply: any) => {
    if (!isAuthorizedCronRequest(request)) {
      reply.status(401);
      return { error: "Unauthorized" };
    }

    const job = await enqueueCycleForRuntime(kind);
    reply.status(202);
    return formatResponse({
      accepted: true,
      kind,
      jobId: job.id,
      transport: job.transport,
      path: cronPath(kind),
    });
  };

  fastify.get("/api/cron/jevo/delta", enqueueCycle("DELTA"));
  fastify.get("/api/cron/jevo/ranking", enqueueCycle("RANKING"));
  fastify.get("/api/cron/jevo/full", enqueueCycle("FULL"));
  fastify.get("/api/cron/jevo/narrative", enqueueCycle("NARRATIVE"));

  fastify.get("/api/cron/jevo/launch", async (request, reply) => {
    if (!isAuthorizedCronRequest(request)) {
      reply.status(401);
      return { error: "Unauthorized" };
    }

    const job = await enqueueVercelLaunchProgression();
    reply.status(202);
    return formatResponse({
      accepted: true,
      kind: "LAUNCH_PROGRESSION",
      jobId: job.id,
      transport: job.transport,
    });
  });
};
