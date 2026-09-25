import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { db, pool } from "./client";
import { logger } from "../observability/logger";

export async function runMigrations() {
  logger.info("Running database migrations from ./drizzle...");
  const migrationsFolder = path.resolve(import.meta.dir, "../../drizzle");
  await migrate(db, { migrationsFolder });
  logger.info("Database migrations completed successfully");
}

if (import.meta.main) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, "Migration failed");
      await pool.end();
      process.exit(1);
    });
}
