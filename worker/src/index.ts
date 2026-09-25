import { env } from "./config/env";
import { logger } from "./observability/logger";
import { pool } from "./db/client";
import { seedAssets } from "./db/seed";
import { createServer } from "./api/server";
import {
  startCycleWorker,
  registerRepeatableCycles,
  stopCycleWorker,
} from "./jobs/scheduler";
import { closeEventBus } from "./events";

async function main() {
  logger.info(
    {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      host: env.HOST,
      providerMode: env.PROVIDER_MODE,
      jevMode: env.JEV_MODE,
      logLevel: env.LOG_LEVEL,
    },
    "JEVO worker & API booting (BACKEND 08 - Realtime SSE & Composed Entrypoint)",
  );

  // 1. Seed initial stock assets into Postgres
  try {
    await seedAssets();
  } catch (err) {
    logger.warn({ err }, "Could not seed initial assets (proceeding anyway)");
  }

  // 2. Start BullMQ worker & scheduler
  logger.info("Starting BullMQ cycle worker and registering schedulers...");
  startCycleWorker();
  await registerRepeatableCycles();
  logger.info("Cycle worker and schedulers active");

  // 3. Start Fastify server
  const server = await createServer();
  const address = await server.listen({ port: env.PORT, host: env.HOST });
  logger.info({ address, port: env.PORT }, `JEVO API server listening on ${address}`);

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, "Graceful shutdown initiated...");

    try {
      await server.close();
      logger.info("Fastify server closed");
    } catch (err) {
      logger.error({ err }, "Error closing Fastify server");
    }

    try {
      await stopCycleWorker();
      logger.info("Cycle worker and queues closed");
    } catch (err) {
      logger.error({ err }, "Error stopping cycle worker");
    }

    try {
      await closeEventBus();
      logger.info("Redis event bus connections closed");
    } catch (err) {
      logger.error({ err }, "Error closing event bus");
    }

    try {
      await pool.end();
      logger.info("PostgreSQL connection pool closed");
    } catch (err) {
      logger.error({ err }, "Error closing database pool");
    }

    logger.info("Shutdown completed cleanly");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal crash during worker & API startup");
  process.exit(1);
});
