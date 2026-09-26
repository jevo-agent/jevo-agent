/**
 * TanStack Query hooks for all read-side backend endpoints.
 *
 * Query keys are tuples so EventSourceProvider can invalidate by key prefix.
 *
 * Usage (in any Client Component):
 *   const { data } = useAgentStatus();
 *   data?.data   → AgentRuntime
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiGet, type ApiEnvelope } from "./client";

// ─── Agent ────────────────────────────────────────────────────────────────────

export function useAgentStatus(opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["agent-status"],
    queryFn: () => apiGet("/agent/status"),
    staleTime: 15_000,
    refetchInterval: 30_000,
    ...opts,
  });
}

// ─── Opportunities ────────────────────────────────────────────────────────────

export function useOpportunities(opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: () => apiGet("/opportunities"),
    staleTime: 20_000,
    refetchInterval: 60_000,
    ...opts,
  });
}

// ─── Stock (per-symbol) ───────────────────────────────────────────────────────

export function useStock(symbol: string, opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => apiGet(`/stocks/${encodeURIComponent(symbol)}`),
    enabled: Boolean(symbol),
    staleTime: 20_000,
    ...opts,
  });
}

// ─── Pairings ─────────────────────────────────────────────────────────────────

export function usePairings(opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["pairings"],
    queryFn: () => apiGet("/pairings"),
    staleTime: 20_000,
    ...opts,
  });
}

export function usePairing(id: string, opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["pairing", id],
    queryFn: () => apiGet(`/pairings/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    staleTime: 20_000,
    ...opts,
  });
}

// ─── Launches ─────────────────────────────────────────────────────────────────

export function useLaunches(opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["launches"],
    queryFn: () => apiGet("/launches"),
    staleTime: 20_000,
    ...opts,
  });
}

export function useLaunch(id: string, opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>) {
  return useQuery({
    queryKey: ["launch", id],
    queryFn: () => apiGet(`/launches/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    staleTime: 20_000,
    ...opts,
  });
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export function useMemory(
  params?: { subjectId?: string; subjectType?: string },
  opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>,
) {
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.subjectType) qs.set("subjectType", params.subjectType);
  const qstr = qs.toString();

  return useQuery({
    queryKey: ["memory", params?.subjectId ?? null, params?.subjectType ?? null],
    queryFn: () => apiGet(`/memory${qstr ? `?${qstr}` : ""}`),
    staleTime: 30_000,
    ...opts,
  });
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

export function useCycles(
  limit = 10,
  opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>,
) {
  return useQuery({
    queryKey: ["cycles", limit],
    queryFn: () => apiGet(`/cycles?limit=${limit}`),
    staleTime: 30_000,
    ...opts,
  });
}

// ─── Events (polling fallback) ────────────────────────────────────────────────

export function useEvents(
  params?: { since?: string; limit?: number },
  opts?: Partial<UseQueryOptions<ApiEnvelope<unknown>>>,
) {
  const qs = new URLSearchParams();
  if (params?.since) qs.set("since", params.since);
  if (params?.limit) qs.set("limit", String(params.limit));
  const qstr = qs.toString();

  return useQuery({
    queryKey: ["events", params?.since ?? null],
    queryFn: () => apiGet(`/events${qstr ? `?${qstr}` : ""}`),
    staleTime: 5_000,
    ...opts,
  });
}
