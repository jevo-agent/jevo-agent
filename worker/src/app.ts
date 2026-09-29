import { env } from "./config/env";
import { createServer } from "./api/server";
import { logger } from "./observability/logger";
import { isVercelRuntime } from "./runtime";

/**
 * Stateless Fastify entrypoint for the Vercel API service.
 *
 * Persistent BullMQ consumers and repeat schedulers are intentionally absent.
 * Vercel invokes the same API routes on demand; Cron and Queue consumers call
 * the bounded cycle executor through the protected internal routes.
 */
const app = await createServer();
// Vercel's Fastify runtime expects the function listener on port 3000. Keep
// the local worker's configured port for non-Vercel execution.
const listenPort = isVercelRuntime() ? 3000 : env.PORT;
await app.listen({ port: listenPort, host: env.HOST });
logger.info({ port: listenPort }, "JEVO stateless API service listening");

export default app;
