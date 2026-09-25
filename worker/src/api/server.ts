import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "../config/env";
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

  const frontendOrigin = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Register CORS to allow web frontend access (e.g. Next.js at localhost:3000 or NEXT_PUBLIC_APP_URL)
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return cb(null, true);
      if (
        origin === frontendOrigin ||
        origin === "http://localhost:3000" ||
        origin === "http://127.0.0.1:3000" ||
        env.NODE_ENV === "development"
      ) {
        return cb(null, true);
      }
      return cb(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Last-Event-ID", "Cache-Control"],
    exposedHeaders: ["Last-Event-ID"],
  });

  // Register all API routes under /api/v1 prefix
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
