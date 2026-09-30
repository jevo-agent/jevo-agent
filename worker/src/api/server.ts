import { STATUS_CODES } from "node:http";
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
import { adminRoutes } from "./routes/admin";
import { cronRoutes } from "./routes/cron";
import { internalRoutes } from "./routes/internal";
import { intelligenceRoutes } from "./routes/intelligence";

export async function createServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  // Diagnostic error handler to expose underlying DB driver causes in Vercel logs
  app.setErrorHandler((error, request, reply) => {
    const statusCode =
      error.statusCode && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      console.error("[API_500_DIAGNOSTIC]", {
        url: request.raw.url,
        message: error.message,
        cause: error.cause,
      });
    }

    return reply.status(statusCode).send({
      statusCode,
      error: STATUS_CODES[statusCode] ?? error.name ?? "Error",
      message: error.message,
    });
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

  // Vercel Cron is a short-lived producer. It never executes a cycle inline;
  // the handler publishes a bounded job to the configured queue transport.
  await app.register(cronRoutes);

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
      await v1.register(adminRoutes, { prefix: "/admin" });
      await v1.register(internalRoutes);
      await v1.register(intelligenceRoutes, { prefix: "/intelligence" });
    },
    { prefix: "/api/v1" },
  );

  return app;
}
