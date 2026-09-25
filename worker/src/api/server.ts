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

  // Register CORS to allow web frontend access (e.g. Next.js at NEXT_PUBLIC_APP_URL or localhost in dev)
  const allowedOrigins = new Set<string>();
  if (env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.add(env.NEXT_PUBLIC_APP_URL);
  }
  if (env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, server-to-server)
      if (!origin) return cb(null, true);

      // Section 19 safety guard: in production, strictly allow ONLY configured NEXT_PUBLIC_APP_URL
      if (env.NODE_ENV === "production") {
        if (allowedOrigins.has(origin)) {
          return cb(null, true);
        }
        return cb(new Error("CORS origin not allowed in production"), false);
      }

      // In development/test: allow explicit origins or local frontend hosts
      if (
        allowedOrigins.has(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
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
