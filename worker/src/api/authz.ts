import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env";

export class UnauthorizedError extends Error {
  statusCode = 401;
  error = "Unauthorized";

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Returns the set of valid admin bearer tokens from environment configuration.
 */
export function getAllowedAdminTokens(): Set<string> {
  const tokens = new Set<string>();

  if (env.ADMIN_API_TOKENS) {
    for (const token of env.ADMIN_API_TOKENS.split(",")) {
      const trimmed = token.trim();
      if (trimmed) tokens.add(trimmed);
    }
  }

  if (env.ADMIN_API_KEY) {
    const trimmed = env.ADMIN_API_KEY.trim();
    if (trimmed) tokens.add(trimmed);
  }

  // Fallback for local development/test if neither is configured
  if (tokens.size === 0 && env.NODE_ENV !== "production") {
    tokens.add("local-dev-secret-key");
  }

  return tokens;
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
