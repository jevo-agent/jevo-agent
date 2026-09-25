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
  PROVIDER_MODE: z.enum(["mock", "real"]).default("mock"),
  JEV_MODE: z.enum(["mock", "real"]).default("mock"),
  JEV_API_KEY: z.string().optional(),
  JEV_API_URL: z.string().url().default("https://api.jev.ai/v1"),
  ADMIN_API_TOKENS: z.string().optional(),
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

  // Real JEV mode requires API key
  if (parsed.JEV_MODE === "real" && (!parsed.JEV_API_KEY || parsed.JEV_API_KEY.trim() === "")) {
    throw new Error("Invalid configuration: JEV_API_KEY must be provided when JEV_MODE=real");
  }

  // Section 19: Boot-time assertion preventing mock mode in production
  if (
    parsed.NODE_ENV === "production" &&
    (parsed.PROVIDER_MODE === "mock" || parsed.JEV_MODE === "mock")
  ) {
    throw new Error("Refusing to start: mock mode is not allowed when NODE_ENV=production");
  }

  return parsed;
}

// Lazy or direct export depending on environment
export const env = validateEnv(process.env);
