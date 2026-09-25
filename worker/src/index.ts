import { Client } from "pg";
import Redis from "ioredis";
import { env } from "./config/env";
import { logger } from "./observability/logger";

async function checkDatabaseConnection(): Promise<boolean> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  try {
    await client.connect();
    await client.query("SELECT 1;");
    await client.end();
    logger.info("PostgreSQL connection verified successfully");
    return true;
  } catch (error) {
    logger.warn({ error: (error as Error).message }, "PostgreSQL connection could not be established. Ensure docker-compose is running.");
    try {
      await client.end();
    } catch {
      // ignore close error
    }
    return false;
  }
}

async function checkRedisConnection(): Promise<boolean> {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  redis.on("error", () => {}); // swallow unhandled error event during ping check

  try {
    await redis.connect();
    const pong = await redis.ping();
    await redis.quit();
    logger.info({ pong }, "Redis connection verified successfully");
    return true;
  } catch (error) {
    logger.warn({ error: (error as Error).message }, "Redis connection could not be established. Ensure docker-compose is running.");
    try {
      await redis.quit();
    } catch {
      // ignore close error
    }
    return false;
  }
}

async function main() {
  logger.info(
    {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      providerMode: env.PROVIDER_MODE,
      jevMode: env.JEV_MODE,
      logLevel: env.LOG_LEVEL,
    },
    "JEVO worker booting (BACKEND 00 - Foundation)",
  );

  logger.info("Checking infrastructure connections...");
  const dbOk = await checkDatabaseConnection();
  const redisOk = await checkRedisConnection();

  if (dbOk && redisOk) {
    logger.info("All infrastructure dependencies are healthy");
  } else {
    logger.warn("Worker booted with degraded infrastructure connectivity. Run `docker compose -f docker-compose.dev.yml up -d` to start local services.");
  }

  logger.info("JEVO worker foundation ready for BACKEND 01 (Database & Schema)");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Graceful shutdown initiated");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal crash during worker startup");
  process.exit(1);
});
