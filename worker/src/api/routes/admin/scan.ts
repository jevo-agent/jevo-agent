import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { enqueueCycleJob } from "../../../jobs/queues";
import { formatResponse } from "../../envelope";
import { recordOperatorProtocolEvent } from "./common";

const triggerScanBodySchema = z.object({
  kind: z.enum(["DELTA", "RANKING", "FULL", "NARRATIVE"]),
});

export const adminScanRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. POST /api/v1/admin/scan/trigger
  fastify.post("/scan/trigger", async (request, reply) => {
    const parsed = triggerScanBodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid body. 'kind' must be one of: DELTA, RANKING, FULL, NARRATIVE",
        issues: parsed.error.issues,
      };
    }

    const { kind } = parsed.data;

    // Enqueue manual job via existing BullMQ helper
    const job = await enqueueCycleJob(kind, { isManual: true });

    // Record operator protocol event
    await recordOperatorProtocolEvent("AGENT_SCAN_TRIGGERED", {
      payload: {
        kind,
        jobId: job.id,
      },
    });

    reply.status(200);
    return formatResponse({
      triggered: true,
      kind,
      jobId: job.id,
    });
  });
};
