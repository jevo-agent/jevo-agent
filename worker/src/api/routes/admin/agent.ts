import type { FastifyPluginAsync } from "fastify";
import {
  pauseAgentCycleQueue,
  resumeAgentCycleQueue,
} from "../../../jobs/scheduler";
import { isVercelRuntime } from "../../../runtime";
import { formatResponse } from "../../envelope";
import { recordOperatorProtocolEvent } from "./common";

export const adminAgentRoutes: FastifyPluginAsync = async (fastify) => {
  // 2a. POST /api/v1/admin/agent/pause
  // Note: queue.pause() and worker.pause() halt dispatching of new waiting jobs.
  // Any cycle job CURRENTLY executing in-flight will continue until completion.
  fastify.post("/agent/pause", async (request, reply) => {
    if (isVercelRuntime()) {
      reply.status(501);
      return {
        error: "Agent pause is local-worker only; Vercel Queue delivery is controlled by deployment state.",
      };
    }
    await pauseAgentCycleQueue();

    await recordOperatorProtocolEvent("AGENT_PAUSED", {
      payload: {
        timestamp: new Date().toISOString(),
      },
    });

    reply.status(200);
    return formatResponse({
      status: "PAUSED",
      paused: true,
    });
  });

  // 2b. POST /api/v1/admin/agent/resume
  fastify.post("/agent/resume", async (request, reply) => {
    if (isVercelRuntime()) {
      reply.status(501);
      return {
        error: "Agent resume is local-worker only; Vercel Queue delivery is controlled by deployment state.",
      };
    }
    await resumeAgentCycleQueue();

    await recordOperatorProtocolEvent("AGENT_RESUMED", {
      payload: {
        timestamp: new Date().toISOString(),
      },
    });

    reply.status(200);
    return formatResponse({
      status: "RESUMED",
      paused: false,
    });
  });
};
