/**
 * Shared helper for admin proxy API routes.
 *
 * All admin write actions go through Next.js API routes (server-side) so the
 * ADMIN_API_TOKENS secret never reaches the browser bundle.
 */

const WORKER_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";

/**
 * Forward a POST request to the worker admin endpoint.
 * Attaches the ADMIN_API_TOKENS Bearer token from the server-side env.
 */
export async function proxyAdminPost(
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  const token = process.env.ADMIN_API_TOKENS?.split(",")[0]?.trim() ?? "";

  const res = await fetch(`${WORKER_BASE}/admin${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // No Next.js caching for write operations
    cache: "no-store",
  });

  return res;
}
