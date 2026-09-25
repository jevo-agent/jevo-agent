import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "DATABASE_URL",
      "REDIS_URL",
      "JEV_API_KEY",
      "ADMIN_API_KEY",
      "*.password",
      "*.secret",
      "*.authorization",
      "*.cookie",
      "headers.authorization",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
