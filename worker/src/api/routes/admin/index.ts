import type { FastifyPluginAsync } from "fastify";
import { requireAdminAuth } from "../../authz";
import { adminScanRoutes } from "./scan";
import { adminAgentRoutes } from "./agent";
import { adminPairingRoutes } from "./pairings";
import { adminLaunchRoutes } from "./launches";
import { adminConfigRoutes } from "./config";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce Bearer token allowlist on all admin routes
  fastify.addHook("preHandler", requireAdminAuth);

  await fastify.register(adminScanRoutes);
  await fastify.register(adminAgentRoutes);
  await fastify.register(adminPairingRoutes);
  await fastify.register(adminLaunchRoutes);
  await fastify.register(adminConfigRoutes);
};
