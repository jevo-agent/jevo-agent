import fastify, { type FastifyInstance } from "fastify";
import { agentRoutes } from "./routes/agent";
import { cyclesRoutes } from "./routes/cycles";
import { eventsRoutes } from "./routes/events";
import { launchesRoutes } from "./routes/launches";
import { memoryRoutes } from "./routes/memory";
import { opportunitiesRoutes } from "./routes/opportunities";
import { pairingsRoutes } from "./routes/pairings";
import { stocksRoutes } from "./routes/stocks";

export async function createServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  // Register all 10 API endpoints under /api/v1 prefix
  await app.register(
    async (v1) => {
      await v1.register(agentRoutes);
      await v1.register(opportunitiesRoutes);
      await v1.register(stocksRoutes);
      await v1.register(pairingsRoutes);
      await v1.register(launchesRoutes);
      await v1.register(memoryRoutes);
      await v1.register(cyclesRoutes);
      await v1.register(eventsRoutes);
    },
    { prefix: "/api/v1" },
  );

  return app;
}
