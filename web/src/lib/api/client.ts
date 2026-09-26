/**
 * Thin fetch wrapper that reads NEXT_PUBLIC_API_URL (real backend) at runtime.
 * Falls back to the fixture Next.js routes when the env var is absent so that
 * `bun dev` works without the worker running.
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
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  // Fixture fallback (Next.js API routes under /api/fixture)
  return "/api/fixture";
}

export async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    // Next.js caching: revalidate every 30s
    next: { revalidate: 30 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${url}`);
  }

  return res.json() as Promise<ApiEnvelope<T>>;
}
