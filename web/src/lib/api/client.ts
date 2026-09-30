/**
 * Thin fetch wrapper that reads NEXT_PUBLIC_API_URL (real backend) at runtime.
 * Uses local fixture routes only in an explicit development/demo mode.
 *
 * Failure contract:
 *   - If NEXT_PUBLIC_API_URL is set and the request fails (network error, non-2xx,
 *     timeout), this function THROWS. TanStack Query surfaces the error via
 *     query.isError / query.error — no silent fallback to mock data.
 *   - Production never falls back to fixture data when the worker URL is absent.
 *     Set NEXT_PUBLIC_JEVO_DEMO_MODE=true for an intentional demo build.
 *   - `cache: "no-store"` is used for all requests so the Next.js data cache
 *     never serves stale responses after the backend goes down.
 */

import { z } from "zod";

export interface ApiMeta {
  cursor?: string;
  total?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

function getBaseUrl(): string {
  // In the browser, prefer same-origin relative path /api/v1 so any custom domain
  // (e.g. jevoagent.tech) works seamlessly without cross-origin CORS barriers.
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  const envUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const isExplicitDemo =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_JEVO_DEMO_MODE === "true";

  if (isExplicitDemo) {
    return "/api/fixture";
  }

  return "/api/v1";
}

export function isJevoDemoMode() {
  return typeof process !== "undefined" && process.env.NEXT_PUBLIC_JEVO_DEMO_MODE === "true";
}

export async function apiGet<T>(path: string, dataSchema?: z.ZodType<T>): Promise<ApiEnvelope<T>> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // No Next.js data-cache: always hit the network so a backend failure
      // is immediately visible as a query error, not silently hidden by a
      // cached 200 response from a previous successful request.
      cache: "no-store",
    });
  } catch (networkErr) {
    // Network-level failure (ECONNREFUSED, timeout, DNS, etc.)
    throw new Error(
      `Network error reaching ${url}: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  if (!res.ok) {
    // HTTP error (4xx, 5xx) — throw so TanStack Query marks the query as failed
    throw new Error(`API error ${res.status} ${res.statusText} for ${url}`);
  }

  const payload: unknown = await res.json();
  const envelopeSchema = z.object({
    data: dataSchema ?? z.unknown(),
    meta: z
      .object({
        cursor: z.string().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
  });

  return envelopeSchema.parse(payload) as ApiEnvelope<T>;
}
