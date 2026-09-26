/**
 * Thin fetch wrapper that reads NEXT_PUBLIC_API_URL (real backend) at runtime.
 * Falls back to the local fixture routes ONLY when NEXT_PUBLIC_API_URL is unset.
 *
 * Failure contract:
 *   - If NEXT_PUBLIC_API_URL is set and the request fails (network error, non-2xx,
 *     timeout), this function THROWS. TanStack Query surfaces the error via
 *     query.isError / query.error — no silent fallback to mock data.
 *   - The fixture routes (/api/fixture/*) are used ONLY when the env var is absent,
 *     meaning the dev explicitly hasn't configured a real backend yet.
 *   - `cache: "no-store"` is used for all requests so the Next.js data cache
 *     never serves stale responses after the backend goes down.
 */

export interface ApiMeta {
  cursor?: string;
  total?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

function getBaseUrl(): string {
  const envUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  // Fixture fallback — only when env var is NOT set
  return "/api/fixture";
}

export async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
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

  return res.json() as Promise<ApiEnvelope<T>>;
}
