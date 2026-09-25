import { randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env";
import { logger } from "../observability/logger";

export class UnauthorizedError extends Error {
  statusCode = 401;
  error = "Unauthorized";

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

let cachedTokens: Set<string> | null = null;
let ephemeralDevToken: string | null = null;

/**
 * Returns the set of valid admin bearer tokens from environment configuration.
 * If ADMIN_API_TOKENS is empty in non-production, generates a one-time random token
 * and prints it to the log. No static string is hardcoded in source code.
 */
export function getAllowedAdminTokens(): Set<string> {
  if (cachedTokens) {
    return cachedTokens;
  }

  const tokens = new Set<string>();

  if (env.ADMIN_API_TOKENS) {
    for (const token of env.ADMIN_API_TOKENS.split(",")) {
      const trimmed = token.trim();
      if (trimmed) tokens.add(trimmed);
    }
  }

  // Non-production fallback: generate a random token once on boot and print to log
  if (tokens.size === 0 && env.NODE_ENV !== "production") {
    ephemeralDevToken = randomBytes(24).toString("hex");
    tokens.add(ephemeralDevToken);
    logger.warn(
      { devToken: ephemeralDevToken },
      "No ADMIN_API_TOKENS configured in non-production. Generated one-time random ephemeral admin token",
    );
  }

  cachedTokens = tokens;
  return tokens;
}

/**
 * Resets the in-memory token cache (used for test isolation).
 */
export function resetAllowedAdminTokensCache(): void {
  cachedTokens = null;
  ephemeralDevToken = null;
}

/**
 * Fastify preHandler hook enforcing Bearer token authentication against allowlist.
 * Throws UnauthorizedError on missing or invalid token to halt the hook pipeline cleanly.
 */
export async function requireAdminAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new UnauthorizedError(
      "Invalid Authorization header format. Expected 'Bearer <token>'",
    );
  }

  const token = parts[1].trim();
  const allowedTokens = getAllowedAdminTokens();

  if (!allowedTokens.has(token)) {
    throw new UnauthorizedError("Invalid admin token");
  }
}
