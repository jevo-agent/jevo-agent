import { z } from "zod";
import dotenv from "dotenv";

// Load .env if present
dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  /**
   * Global/legacy master toggle. Runtime provider selection is controlled by
   * the granular toggles below; this field is retained for compatibility and
   * startup safety only.
   */
  PROVIDER_MODE: z.enum(["mock", "real"]).default("mock"),
  JEV_MODE: z.enum(["mock", "real"]).default("mock"),
  AI_GATEWAY_API_KEY: z.string().optional(),
  /** Deprecated compatibility fields; AI Gateway is the only real JEV transport. */
  JEV_API_KEY: z.string().optional(),
  JEV_API_URL: z.string().url().default("https://api.jev.ai/v1"),
  JEV_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  MARKET_DATA_MODE: z.enum(["mock", "real"]).default("mock"),
  NARRATIVE_MODE: z.enum(["mock", "real"]).default("mock"),
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  ALPHA_VANTAGE_CACHE_TTL_MS: z.coerce.number().int().positive().default(22 * 60 * 60 * 1000),
  ALPHA_VANTAGE_MAX_DAILY_REQUESTS: z.coerce.number().int().positive().default(25),
  STOCK_TOKEN_MODE: z.enum(["mock", "real"]).default("mock"),
  ROBINHOOD_RPC_URL: z.string().url().default("https://rpc.mainnet.chain.robinhood.com"),
  DEXPAPRIKA_API_URL: z.string().url().default("https://api.dexpaprika.com"),
  DEXPAPRIKA_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  ADMIN_API_TOKENS: z.string().optional(),
  /** Secret shared by the Vercel Queue consumer and the internal worker route. */
  VERCEL_INTERNAL_JOB_TOKEN: z.string().optional(),
  /** Secret used by Vercel Cron's Authorization header. */
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(input: Record<string, unknown> = process.env): AppEnv {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  const parsed = result.data;

  // Real JEV mode requires the server-side Vercel AI Gateway key.
  if (parsed.JEV_MODE === "real" && (!parsed.AI_GATEWAY_API_KEY || parsed.AI_GATEWAY_API_KEY.trim() === "")) {
    throw new Error("Invalid configuration: AI_GATEWAY_API_KEY must be provided when JEV_MODE=real");
  }

  // Real Market Data or Narrative mode requires ALPHA_VANTAGE_API_KEY
  if (
    (parsed.MARKET_DATA_MODE === "real" || parsed.NARRATIVE_MODE === "real") &&
    (!parsed.ALPHA_VANTAGE_API_KEY || parsed.ALPHA_VANTAGE_API_KEY.trim() === "")
  ) {
    throw new Error("Invalid configuration: ALPHA_VANTAGE_API_KEY must be provided when MARKET_DATA_MODE=real or NARRATIVE_MODE=real");
  }

  if (parsed.NODE_ENV === "production") {
    // Granular provider modes are the source of truth in production. Requiring
    // them to be present prevents a missing deployment variable from silently
    // becoming the schema's development-friendly `mock` default.
    const requiredModeKeys = [
      "JEV_MODE",
      "MARKET_DATA_MODE",
      "NARRATIVE_MODE",
      "STOCK_TOKEN_MODE",
    ] as const;
    const missingModeKeys = requiredModeKeys.filter((key) => {
      const value = input[key];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingModeKeys.length > 0) {
      throw new Error(
        `Invalid configuration: ${missingModeKeys.join(", ")} must be explicitly configured when NODE_ENV=production`,
      );
    }

    // PROVIDER_MODE is a legacy compatibility field. It intentionally has no
    // authority over the actual provider registry once granular modes are
    // explicitly configured.
  }

  return parsed;
}

// Lazy or direct export depending on environment
export const env = validateEnv(process.env);
