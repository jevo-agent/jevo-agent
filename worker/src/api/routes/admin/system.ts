import type { FastifyPluginAsync } from "fastify";
import { formatResponse } from "../../envelope";
import {
  seedAssets,
  seedMemeConcepts,
  INITIAL_ASSETS,
  CURATED_MEME_CONCEPTS,
} from "../../../db/seed";

/**
 * Temporary admin route for initial production database seeding.
 * Guarded by requireAdminAuth (inherited from adminRoutes preHandler).
 * Idempotent (uses onConflictDoUpdate on primary keys).
 * NOTE: To be removed/disabled immediately after initial setup.
 */
export const adminSystemRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/system/seed", async (_request, reply) => {
    await seedAssets();
    await seedMemeConcepts();

    reply.status(200);
    return formatResponse({
      seeded: true,
      assetsCount: INITIAL_ASSETS.length,
      activeAssetsCount: INITIAL_ASSETS.filter((a) => a.active).length,
      memeConceptsCount: CURATED_MEME_CONCEPTS.length,
    });
  });
};
