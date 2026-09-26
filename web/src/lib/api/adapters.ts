import { z } from "zod";

import { mockAgentState } from "@/data/mock-agent-state";
import { agentRuntimeSchema, agentCycleSchema, memoryComparisonSchema, memoryRecordSchema, stockSchema, pairingSchema, launchSchema } from "@/schemas/protocol";
import type { AgentCycle, AgentRuntime, MemoryComparison, MemoryRecord, ProviderReference } from "@/types/agent";
import type { AppData } from "@/components/app/types";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";
import {
  agentApiSchema,
  cycleApiSchema,
  launchApiSchema,
  memoryApiSchema,
  opportunityApiSchema,
  pairingApiSchema,
  scoreDetailApiSchema,
  stockApiSchema,
} from "./schemas";

export type AgentApi = z.infer<typeof agentApiSchema>;
export type OpportunityApi = z.infer<typeof opportunityApiSchema>;
export type PairingApi = z.infer<typeof pairingApiSchema>;
export type LaunchApi = z.infer<typeof launchApiSchema>;
export type StockApi = z.infer<typeof stockApiSchema>;
export type MemoryApi = z.infer<typeof memoryApiSchema>;
export type CycleApi = z.infer<typeof cycleApiSchema>;
export type ScoreDetailApi = z.infer<typeof scoreDetailApiSchema>;

const eventTypes = new Set(["OBSERVE", "SIGNAL", "JEV_DECISION", "PAIRING", "LAUNCH", "MEMORY", "POLICY", "ACTION"] as const);

function eventType(value: string): AgentRuntime["latestEvents"][number]["type"] {
  return eventTypes.has(value as (typeof eventTypes extends Set<infer V> ? V : never))
    ? (value as AgentRuntime["latestEvents"][number]["type"])
    : "ACTION";
}

function cycleNumber(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeText(value: string | null | undefined, unavailable = "UNAVAILABLE") {
  return value?.trim() || unavailable;
}

export function adaptAgent(raw: AgentApi): AgentRuntime {
  return agentRuntimeSchema.parse({
    ...raw,
    latestEvents: raw.latestEvents.map((entry) => ({ ...entry, type: eventType(entry.type) })),
  });
}

function signalFromDimension(symbol: string, id: string, label: string, value: number | undefined, explanation: string): Stock["signals"][number] | null {
  if (value === undefined) return null;
  return {
    id: `${symbol.toLowerCase()}-${id}`,
    label,
    context: "Worker opportunity score dimension",
    score: value,
    delta: null,
    deltaLabel: "—",
    state: "OBSERVED",
    source: "Worker score state",
    dataAgeSeconds: null,
    explanation,
  };
}

function dimensionsFor(raw: OpportunityApi): ScoreDetailApi | undefined {
  return raw.score;
}

function makeSignals(raw: OpportunityApi): Stock["signals"] {
  const dimensions = dimensionsFor(raw);
  const signals = dimensions
    ? [
        signalFromDimension(raw.symbol, "market", "Market momentum", dimensions.marketMomentum, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "narrative", "Narrative momentum", dimensions.narrativeMomentum, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "social", "Social velocity", dimensions.socialVelocity, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "cultural", "Cultural relevance", dimensions.culturalRelevance, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "meme", "Meme compatibility", dimensions.memeCompatibility, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "crypto", "Crypto adjacency", dimensions.cryptoAdjacency, "Persisted opportunity score dimension."),
        signalFromDimension(raw.symbol, "pair", "Pair compatibility", dimensions.pairCompatibility, "Persisted opportunity score dimension."),
      ].filter((signal): signal is NonNullable<typeof signal> => Boolean(signal))
    : [];

  if (signals.length > 0) return signals;
  return [{
    id: `${raw.symbol.toLowerCase()}-opportunity`,
    label: "Opportunity score",
    context: "Worker ranking state",
    score: raw.opportunityScore,
    delta: null,
    deltaLabel: "—",
    state: "OBSERVED",
    source: "Worker ranking",
    dataAgeSeconds: null,
    explanation: "The worker exposed the aggregate opportunity score without component dimensions.",
  }];
}

function dimensionsForPoint(entry: NonNullable<OpportunityApi["history"]>[number]) {
  const dimensions = entry.dimensions;
  if (!dimensions) return {};
  const pairability = dimensions.pairCompatibility;
  const narrativeValues = [
    dimensions.narrativeMomentum,
    dimensions.culturalRelevance,
    dimensions.socialVelocity,
  ].filter((value): value is number => typeof value === "number");
  return {
    ...(typeof pairability === "number" ? { pairability } : {}),
    ...(narrativeValues.length > 0 ? { narrative: narrativeValues.reduce((sum, value) => sum + value, 0) / narrativeValues.length } : {}),
  };
}

export function adaptOpportunity(raw: OpportunityApi): Stock {
  const history = [...(raw.history ?? [])].sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  const scoreHistory = history.length > 0
    ? history.map((entry) => ({ timestamp: entry.recordedAt, score: entry.score, ...dimensionsForPoint(entry) }))
    : [{ timestamp: raw.recordedAt, score: raw.opportunityScore }];
  const rankedHistory = history.flatMap((entry) => {
    const rank = entry.currentRank ?? entry.rank;
    return typeof rank === "number" ? [{ timestamp: entry.recordedAt, rank }] : [];
  });
  const rankHistory = rankedHistory.length > 0
    ? rankedHistory
    : [{ timestamp: raw.recordedAt, rank: raw.currentRank }];
  const previousScore = raw.previousScore ?? scoreHistory.at(-2)?.score ?? null;
  const previousRank = raw.previousRank ?? null;
  const decision = safeText(raw.decision);
  const decisionTrace = raw.decision
    ? [{
        id: `decision-${raw.symbol}-${String(raw.cycleId)}`,
        timestamp: raw.recordedAt,
        type: "JEV_DECISION" as const,
        summary: `Worker published ${raw.symbol} as ${raw.decision}.`,
      }]
    : [];

  return stockSchema.parse({
    symbol: raw.symbol,
    // The worker may omit a display name while the asset registry is being
    // hydrated. Keep the missing value explicit instead of inventing a
    // product label that could be mistaken for canonical metadata.
    name: raw.asset?.name ?? "UNAVAILABLE",
    currentRank: raw.currentRank,
    previousRank,
    opportunityScore: raw.opportunityScore,
    previousScore,
    rankMovement: previousRank === null ? null : previousRank - raw.currentRank,
    jevDecision: decision,
    confidence: raw.confidence ?? null,
    lastEvaluatedAt: raw.recordedAt,
    signals: makeSignals(raw),
    scoreHistory,
    rankHistory,
    decisionTrace,
  });
}

function statusForPairing(value: string): Pairing["status"] {
  const normalized = value.toUpperCase();
  if (normalized === "CURATED") return "CURATED";
  if (normalized === "LAUNCH_CANDIDATE") return "LAUNCH_CANDIDATE";
  if (normalized === "LAUNCHED") return "LAUNCHED";
  if (normalized === "ARCHIVED") return "ARCHIVED";
  return "AGENT_PROPOSED";
}

function factorList(raw: PairingApi): Pairing["factors"] {
  if (Array.isArray(raw.components)) {
    return raw.components.map((factor, index) => ({
      id: `${raw.id}-factor-${index + 1}`,
      label: factor.label,
      score: factor.score,
      delta: null,
      state: "OBSERVED",
      source: "Worker pairing score",
      explanation: "Persisted pairing component score.",
    }));
  }
  const labels: Array<["narrative" | "cultural" | "meme" | "crypto" | "timing" | "stockRelevance", string]> = [
    ["narrative", "Narrative fit"],
    ["cultural", "Cultural fit"],
    ["meme", "Meme fit"],
    ["crypto", "Crypto fit"],
    ["timing", "Timing"],
    ["stockRelevance", "Stock relevance"],
  ];
  type ComponentKey = "narrative" | "cultural" | "meme" | "crypto" | "timing" | "stockRelevance";
  const components = raw.components as Partial<Record<ComponentKey, number>>;
  return labels
    .map(([key, label]) => ({ key, label, score: components[key] }))
    .filter((entry): entry is { key: ComponentKey; label: string; score: number } => typeof entry.score === "number")
    .map((entry) => ({
      id: `${raw.id}-${entry.key}`,
      label: entry.label,
      score: entry.score,
      delta: null,
      state: "OBSERVED",
      source: "Worker pairing score",
      explanation: "Persisted pairing component score.",
    }));
}

export function pairingSlug(symbol: string, memeSymbol: string) {
  return `${symbol.toLowerCase()}-${memeSymbol.replace(/^\$/, "").toLowerCase()}`;
}

export function adaptPairing(raw: PairingApi): Pairing {
  const status = statusForPairing(raw.lifecycleState);
  const history = raw.history?.map((entry) => ({
    timestamp: entry.transitionedAt,
    summary: `${entry.actor} moved pairing state ${entry.fromState} → ${entry.toState}.`,
    state: entry.toState,
  })) ?? [{ timestamp: raw.createdAt, summary: `Worker published pairing in ${raw.lifecycleState} state.`, state: raw.lifecycleState }];
  const lifecycle = history.map((entry) => ({
    stage: entry.state === "ARCHIVED" ? "DETECTED" : entry.state as Pairing["lifecycle"][number]["stage"],
    status: entry.state === raw.lifecycleState ? "ACTIVE" as const : "COMPLETE" as const,
    timestamp: entry.timestamp,
  }));
  const thesis = raw.thesis;
  const factors = factorList(raw);
  return pairingSchema.parse({
    id: raw.id,
    slug: pairingSlug(raw.symbol, raw.memeSymbol),
    stockSymbol: raw.symbol,
    memeName: raw.memeSymbol.replace(/^\$/, ""),
    symbol: raw.memeSymbol,
    pairScore: raw.pairingScore,
    jevDecision: safeText(raw.decision, "UNAVAILABLE"),
    confidence: raw.confidence ?? null,
    status,
    thesis: {
      core: thesis.core ?? "Structured pairing thesis is not available from the worker response.",
      whyStock: thesis.whyStock ?? "Structured stock rationale is not available from the worker response.",
      whyMeme: thesis.whyMeme ?? "Structured meme rationale is not available from the worker response.",
      whyPair: thesis.whyPair ?? "Structured pairing rationale is not available from the worker response.",
      whyNow: thesis.whyNow ?? "Structured timing rationale is not available from the worker response.",
    },
    factors: factors.length > 0 ? factors : [{ id: `${raw.id}-score`, label: "Pairing score", score: raw.pairingScore, delta: null, state: "OBSERVED", source: "Worker pairing score", explanation: "Persisted aggregate pairing score." }],
    alternatives: (raw.alternates ?? []).flatMap((alternate) => {
      if (!alternate || typeof alternate !== "object") return [];
      const item = alternate as Record<string, unknown>;
      if (typeof item.memeSymbol !== "string" || typeof item.pairingScore !== "number") return [];
      return [{ memeName: item.memeSymbol.replace(/^\$/, ""), symbol: item.memeSymbol, pairScore: item.pairingScore, rationale: "Worker-provided alternate candidate." }];
    }),
    lifecycle: lifecycle.length > 0 ? lifecycle : [{ stage: "DETECTED", status: "ACTIVE", timestamp: raw.createdAt }],
    history,
    curationState: status === "CURATED" || status === "LAUNCH_CANDIDATE" || status === "LAUNCHED" ? "APPROVED" : status === "ARCHIVED" ? "REJECTED" : "PENDING",
  });
}

export function adaptLaunch(raw: LaunchApi): Launch | null {
  const full = launchSchema.safeParse(raw);
  if (full.success) return full.data;
  // A partial launch response is not a launch state. Do not synthesize a
  // deadline, stage, policy checklist, wallet, contract, or transaction state.
  return null;
}

export function adaptMemory(raw: MemoryApi): MemoryRecord {
  const previousState = Object.entries(raw.previousState).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") || "UNAVAILABLE";
  const currentState = Object.entries(raw.currentState).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") || "UNAVAILABLE";
  return memoryRecordSchema.parse({
    id: raw.id,
    cycleId: cycleNumber(raw.cycleId),
    eventType: eventType(raw.subjectType === "SYSTEM" ? "ACTION" : raw.decision ?? "MEMORY"),
    subject: raw.subjectId,
    previousState,
    currentState,
    decision: safeText(raw.decision, "OBSERVED"),
    structuredEvidence: raw.evidenceRefs.length > 0 ? raw.evidenceRefs.map((value) => ({ label: "Evidence reference", value })) : [{ label: "Observed change", value: raw.observedChange }],
    timestamp: raw.recordedAt,
    actor: "JEVO_AGENT",
    summary: raw.observedChange,
  });
}

export function adaptCycle(raw: CycleApi): AgentCycle {
  return agentCycleSchema.parse({
    id: cycleNumber(raw.id),
    timestamp: raw.completedAt ?? raw.startedAt,
    assetsEvaluated: raw.assetsScanned,
    decisions: raw.signalsProcessed,
    rankChanges: null,
    pairingChanges: null,
    launchChanges: null,
    qualifiedCandidates: null,
    summary: `${raw.kind} cycle ${String(raw.id)} / ${raw.status}`,
    status: raw.status === "RUNNING" ? "ACTIVE" : "COMPLETE",
  });
}

export function adaptStockDetail(raw: StockApi, fallback?: OpportunityApi): Stock | null {
  const score = raw.current.score;
  const latestRank = raw.rankHistory[0];
  if (!score || !latestRank) return null;

  const scoreByCycle = new Map(raw.scoreHistory.map((entry) => [String(entry.cycleId), entry]));
  const history = raw.rankHistory.map((entry) => {
    const scoreEntry = scoreByCycle.get(String(entry.cycleId));
    return {
      cycleId: entry.cycleId,
      currentRank: entry.currentRank,
      score: scoreEntry?.score ?? entry.opportunityScore,
      recordedAt: entry.recordedAt,
      dimensions: scoreEntry,
    };
  });
  const previousScore = fallback?.previousScore ?? history[1]?.score ?? null;
  const opportunity: OpportunityApi = {
    cycleId: score.cycleId,
    symbol: raw.asset.symbol,
    currentRank: raw.current.rank,
    previousRank: raw.current.previousRank,
    opportunityScore: score.score,
    previousScore,
    recordedAt: latestRank.recordedAt,
    decision: raw.current.decision?.decision,
    confidence: raw.current.decision?.confidence,
    score,
    asset: raw.asset,
    history,
  };
  const adapted = adaptOpportunity(opportunity);
  const eventTrace = raw.recentEvents.map((event) => ({
    id: event.id,
    timestamp: event.recordedAt,
    type: "JEV_DECISION" as const,
    summary: event.observedChange,
  }));
  return stockSchema.parse({ ...adapted, decisionTrace: eventTrace.length > 0 ? eventTrace : adapted.decisionTrace });
}

export function createProtocolData(input: {
  agent?: AgentApi;
  opportunities: OpportunityApi[];
  pairings?: PairingApi[];
  launches?: LaunchApi[];
  memory?: MemoryApi[];
  cycles?: CycleApi[];
}): AppData | null {
  if (!input.agent) return null;
  const assets = (input.opportunities ?? []).map(adaptOpportunity).sort((left, right) => left.currentRank - right.currentRank);
  const featuredAsset = assets[0];
  if (!featuredAsset) return null;

  const ranking = assets.map((asset) => asset.symbol);
  const pairings = (input.pairings ?? []).map(adaptPairing);
  const candidateLaunches = (input.launches ?? [])
    .map((raw) => adaptLaunch(raw))
    .filter((launch): launch is Launch => Boolean(launch));
  const launch = candidateLaunches[0] ?? null;
  const featuredPairing =
    (launch ? pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug) : null) ??
    pairings.find((pairing) => pairing.stockSymbol === featuredAsset.symbol) ??
    pairings[0] ??
    null;

  const agent = adaptAgent(input.agent);

  const memory = (input.memory ?? []).map(adaptMemory);
  const cycles = (input.cycles ?? []).map(adaptCycle);
  const previous = assets[0]?.previousScore;
  const current = assets[0]?.opportunityScore;
  const memoryComparison: MemoryComparison = memoryComparisonSchema.parse({
    previousCycle: null,
    currentCycle: agent.activeCycle,
    entries: [{
      label: `${featuredAsset.symbol} opportunity`,
      previous: previous === null ? "UNAVAILABLE" : previous.toFixed(1),
      current: current.toFixed(1),
      delta: previous === null ? "UNAVAILABLE" : `${current - previous >= 0 ? "+" : ""}${(current - previous).toFixed(1)}`,
    }],
  });
  const providers: ProviderReference[] = [];
  return {
    agent,
    assets,
    ranking,
    pairings,
    launch,
    memory,
    featuredAsset,
    featuredPairing,
    agentCycles: cycles,
    memoryComparison,
    providers,
  };
}

export function demoProtocolData(): AppData {
  const featuredAsset = mockAgentState.assets.find((asset) => asset.symbol === "NVDA") ?? mockAgentState.assets[0];
  const featuredPairing = mockAgentState.pairings.find((pairing) => pairing.slug === mockAgentState.launch.selectedPairingSlug) ?? mockAgentState.pairings[0];
  if (!featuredAsset || !featuredPairing) {
    throw new Error("Demo protocol fixture is missing its featured asset or pairing.");
  }
  return { ...mockAgentState, featuredAsset, featuredPairing };
}
