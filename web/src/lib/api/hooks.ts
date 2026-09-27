/**
 * Typed TanStack Query boundaries for the worker read API.
 * Every response is runtime validated before it reaches a page.
 */

import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { AppData, DomainStatus } from "@/components/app/types";
import { apiGet, isJevoDemoMode, type ApiEnvelope } from "./client";
import {
  adaptAgent,
  adaptPairing,
  adaptStockDetail,
  createProtocolData,
  demoProtocolData,
  type AgentApi,
  type CycleApi,
  type LaunchApi,
  type MemoryApi,
  type OpportunityApi,
  type PairingApi,
  type StockApi,
} from "./adapters";
import {
  agentApiSchema,
  cycleApiSchema,
  launchApiSchema,
  memoryApiSchema,
  opportunityApiSchema,
  pairingApiSchema,
  protocolEventApiSchema,
  stockApiSchema,
} from "./schemas";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

type ReadOptions<T> = Partial<Omit<UseQueryOptions<ApiEnvelope<T>, Error>, "queryKey" | "queryFn">>;

export function useAgentStatus(opts?: ReadOptions<AgentApi>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["agent-status"],
    queryFn: () => apiGet("/agent/status", agentApiSchema),
    staleTime: 15_000,
    refetchInterval: 30_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useOpportunities(opts?: ReadOptions<OpportunityApi[]>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: () => apiGet("/opportunities", opportunityApiSchema.array()),
    staleTime: 20_000,
    refetchInterval: 60_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useStock(symbol: string, opts?: ReadOptions<StockApi>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => apiGet(`/stocks/${encodeURIComponent(symbol)}`, stockApiSchema),
    staleTime: 20_000,
    ...opts,
    enabled: !demo && Boolean(symbol) && (opts?.enabled ?? true),
  });
}

export function usePairings(opts?: ReadOptions<PairingApi[]>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["pairings"],
    queryFn: () => apiGet("/pairings", pairingApiSchema.array()),
    staleTime: 20_000,
    refetchInterval: 60_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function usePairing(id: string, opts?: ReadOptions<PairingApi>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["pairing", id],
    queryFn: () => apiGet(`/pairings/${encodeURIComponent(id)}`, pairingApiSchema),
    staleTime: 20_000,
    ...opts,
    enabled: !demo && Boolean(id) && (opts?.enabled ?? true),
  });
}

export function useLaunches(opts?: ReadOptions<LaunchApi[]>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["launches"],
    queryFn: () => apiGet("/launches", launchApiSchema.array()),
    staleTime: 20_000,
    refetchInterval: 30_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useLaunch(id: string, opts?: ReadOptions<LaunchApi>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["launch", id],
    queryFn: () => apiGet(`/launches/${encodeURIComponent(id)}`, launchApiSchema),
    staleTime: 20_000,
    ...opts,
    enabled: !demo && Boolean(id) && (opts?.enabled ?? true),
  });
}

export function useMemory(
  params?: { subjectId?: string; subjectType?: string },
  opts?: ReadOptions<MemoryApi[]>,
) {
  const demo = isJevoDemoMode();
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.subjectType) qs.set("subjectType", params.subjectType);
  const qstr = qs.toString();
  return useQuery({
    queryKey: ["memory", params?.subjectId ?? null, params?.subjectType ?? null],
    queryFn: () => apiGet(`/memory${qstr ? `?${qstr}` : ""}`, memoryApiSchema.array()),
    staleTime: 30_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useCycles(limit = 10, opts?: ReadOptions<CycleApi[]>) {
  const demo = isJevoDemoMode();
  return useQuery({
    queryKey: ["cycles", limit],
    queryFn: () => apiGet(`/cycles?limit=${limit}`, cycleApiSchema.array()),
    staleTime: 30_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useEvents(
  params?: { since?: string; limit?: number },
  opts?: ReadOptions<unknown[]>,
) {
  const demo = isJevoDemoMode();
  const qs = new URLSearchParams();
  if (params?.since) qs.set("since", params.since);
  if (params?.limit) qs.set("limit", String(params.limit));
  const qstr = qs.toString();
  return useQuery({
    queryKey: ["events", params?.since ?? null],
    queryFn: () => apiGet(`/events${qstr ? `?${qstr}` : ""}`, protocolEventApiSchema.array()),
    staleTime: 5_000,
    ...opts,
    enabled: !demo && (opts?.enabled ?? true),
  });
}

export function useProtocolState() {
  const demo = isJevoDemoMode();
  const queryOptions = { enabled: !demo };
  const agentQuery = useAgentStatus(queryOptions);
  const opportunitiesQuery = useOpportunities(queryOptions);
  const pairingsQuery = usePairings(queryOptions);
  const launchesQuery = useLaunches(queryOptions);
  const memoryQuery = useMemory(undefined, queryOptions);
  const cyclesQuery = useCycles(10, queryOptions);

  const domainStatus = useMemo<DomainStatus>(() => ({
    agent: demo ? "ok" : agentQuery.isPending ? "loading" : agentQuery.isError ? "error" : "ok",
    opportunities: demo ? "ok" : opportunitiesQuery.isPending ? "loading" : opportunitiesQuery.isError ? "error" : "ok",
    pairings: demo ? "ok" : pairingsQuery.isPending ? "loading" : pairingsQuery.isError ? "error" : "ok",
    launches: demo ? "ok" : launchesQuery.isPending ? "loading" : launchesQuery.isError ? "error" : "ok",
    memory: demo ? "ok" : memoryQuery.isPending ? "loading" : memoryQuery.isError ? "error" : "ok",
    cycles: demo ? "ok" : cyclesQuery.isPending ? "loading" : cyclesQuery.isError ? "error" : "ok",
  }), [agentQuery.isError, agentQuery.isPending, cyclesQuery.isError, cyclesQuery.isPending, demo, launchesQuery.isError, launchesQuery.isPending, memoryQuery.isError, memoryQuery.isPending, opportunitiesQuery.isError, opportunitiesQuery.isPending, pairingsQuery.isError, pairingsQuery.isPending]);

  const data = useMemo<AppData | null>(() => {
    if (demo) return demoProtocolData();
    if (!opportunitiesQuery.data?.data || opportunitiesQuery.data.data.length === 0) return null;
    return createProtocolData({
      agent: agentQuery.data?.data,
      opportunities: opportunitiesQuery.data.data,
      pairings: pairingsQuery.data?.data ?? [],
      launches: launchesQuery.data?.data ?? [],
      memory: memoryQuery.data?.data ?? [],
      cycles: cyclesQuery.data?.data ?? [],
      domainStatus,
    });
  }, [agentQuery.data, opportunitiesQuery.data, pairingsQuery.data, launchesQuery.data, memoryQuery.data, cyclesQuery.data, demo, domainStatus]);

  const queries = [agentQuery, opportunitiesQuery, pairingsQuery, launchesQuery, memoryQuery, cyclesQuery];
  const error = opportunitiesQuery.error ?? queries.find((query) => query.error)?.error;
  return {
    data,
    domainStatus,
    isDemo: demo,
    isLoading: !demo && opportunitiesQuery.isPending,
    isError: !demo && opportunitiesQuery.isError,
    error,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}

export function useAdaptedStock(symbol: string) {
  const opportunitiesQuery = useOpportunities();
  const stockQuery = useStock(symbol);
  const demo = isJevoDemoMode();
  const data = useMemo<Stock | null>(() => {
    if (demo) return demoProtocolData().assets.find((asset) => asset.symbol === symbol) ?? null;
    if (!stockQuery.data?.data) return null;
    const fallback = opportunitiesQuery.data?.data.find((item) => item.symbol === symbol);
    return adaptStockDetail(stockQuery.data.data, fallback);
  }, [demo, opportunitiesQuery.data, stockQuery.data, symbol]);
  return {
    ...stockQuery,
    data: data ? { data } : undefined,
    isLoading: !demo && stockQuery.isPending,
    isError: !demo && stockQuery.isError,
    error: stockQuery.error,
  };
}

export function adaptPairingResponse(raw: PairingApi): Pairing {
  return adaptPairing(raw);
}

export function adaptAgentResponse(raw: AgentApi): AgentRuntime {
  return adaptAgent(raw);
}
