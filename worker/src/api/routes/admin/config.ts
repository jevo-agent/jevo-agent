import type { FastifyPluginAsync } from "fastify";
import {
  createConfigVersion,
  scoreWeightsSchema,
} from "../../../ranking/weights";
import { formatResponse } from "../../envelope";
import { recordOperatorProtocolEvent } from "./common";

export const adminConfigRoutes: FastifyPluginAsync = async (fastify) => {
  // 6. POST /api/v1/admin/config/weights
  fastify.post("/config/weights", async (request, reply) => {
    const parsed = scoreWeightsSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        statusCode: 400,
        error: "Bad Request",
        message: "Invalid score weights. Weights must sum to 1.0",
        issues: parsed.error.issues,
      };
    }

    const configId = `config-v${Date.now()}`;
    const result = await createConfigVersion({
      id: configId,
      weights: parsed.data,
      createdBy: "OPERATOR",
    });

    // Record operator protocol event
    await recordOperatorProtocolEvent("CONFIG_UPDATED", {
      subjectType: "system",
      subjectId: result.configId,
      payload: {
        configId: result.configId,
        weights: result.weights,
      },
    });

    reply.status(200);
    return formatResponse(result);
  });
};
