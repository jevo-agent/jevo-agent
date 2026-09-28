import { env } from "./config/env";
import { createServer } from "./api/server";
import { logger } from "./observability/logger";

/**
 * Stateless Fastify entrypoint for the Vercel API service.
 *
 * Persistent BullMQ consumers and repeat schedulers are intentionally absent.
 * Vercel invokes the same API routes on demand; Cron and Queue consumers call
 * the bounded cycle executor through the protected internal routes.
 */
const app = await createServer();
await app.listen({ port: env.PORT, host: env.HOST });
logger.info({ port: env.PORT }, "JEVO stateless API service listening");

export default app;
