import { z } from "zod";
import { actorSchema, eventTypeSchema, launchStageSchema, timestampSchema } from "./frontend";

// --- Stock Asset Registry (assets table) ---
export const stockAssetSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  stockTokenAddress: z.string().min(1),
  active: z.boolean(),
  createdAt: timestampSchema.optional(),
});

// --- Market Snapshot (market_snapshots table) ---
export const marketSnapshotSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  price: z.number().positive(),
  volume24h: z.number().nonnegative(),
  volatility: z.number().nonnegative(),
  capturedAt: timestampSchema,
  source: z.string().min(1),
});

// --- Signal Observation (signal_observations table) ---
export const signalObservationKindSchema = z.enum([
  "NARRATIVE",
  "SOCIAL",
  "NEWS",
  "ONCHAIN",
]);

export const signalObservationSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  kind: signalObservationKindSchema,
  magnitude: z.number().min(0).max(100),
  label: z.string().min(1),
  capturedAt: timestampSchema,
  source: z.string().min(1),
});

// --- Agent Cycles (agent_cycles table) ---
export const agentCycleKindSchema = z.enum([
  "DELTA",
  "RANKING",
  "FULL",
  "NARRATIVE",
]);

export const agentCycleStatusSchema = z.enum([
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

export const agentCycleRecordSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().positive()]),
  kind: agentCycleKindSchema,
  startedAt: timestampSchema,
  completedAt: timestampSchema.nullable(),
  assetsScanned: z.number().int().nonnegative(),
  signalsProcessed: z.number().int().nonnegative(),
  status: agentCycleStatusSchema,
});

// --- Jev Decisions (jev_decisions table) ---
export const jevDecisionActionSchema = z.enum([
  "PROMOTE",
  "HOLD",
  "DEMOTE",
]);

export const jevDecisionRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.union([z.string().min(1), z.number().int().positive()]),
  symbol: z.string().min(1),
  decision: jevDecisionActionSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(z.string()),
  modelVersion: z.string().min(1),
  createdAt: timestampSchema,
});

// --- Opportunity Scores (opportunity_scores table) ---
export const opportunityScoreDetailSchema = z.object({
  symbol: z.string().min(1),
  cycleId: z.union([z.string().min(1), z.number().int().positive()]),
  marketMomentum: z.number().min(0).max(100),
  narrativeMomentum: z.number().min(0).max(100),
  socialVelocity: z.number().min(0).max(100),
  culturalRelevance: z.number().min(0).max(100),
  memeCompatibility: z.number().min(0).max(100),
  cryptoAdjacency: z.number().min(0).max(100),
  pairCompatibility: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

// --- Rank Snapshot (rank_history table) ---
export const rankSnapshotSchema = z.object({
  cycleId: z.union([z.string().min(1), z.number().int().positive()]),
  symbol: z.string().min(1),
  currentRank: z.number().int().positive(),
  previousRank: z.number().int().positive().nullable(),
  opportunityScore: z.number().min(0).max(100),
  recordedAt: timestampSchema,
});

// --- Pairing Candidate (pairing_candidates table) ---
export const pairingLifecycleStateSchema = z.enum([
  "DETECTED",
  "ANALYZED",
  "PROPOSED",
  "CURATED",
  "LAUNCH_CANDIDATE",
  "LAUNCHED",
  "ARCHIVED",
]);

export const pairingThesisDetailSchema = z.object({
  core: z.string().min(1).optional(),
  whyStock: z.string().min(1),
  whyMeme: z.string().min(1),
  whyPair: z.string().min(1),
  whyNow: z.string().min(1),
});

export const pairingComponentScoresSchema = z.object({
  narrative: z.number().min(0).max(100),
  cultural: z.number().min(0).max(100),
  meme: z.number().min(0).max(100),
  crypto: z.number().min(0).max(100),
  timing: z.number().min(0).max(100),
  stockRelevance: z.number().min(0).max(100),
});

export const pairingCandidateRecordSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  memeSymbol: z.string().min(1),
  thesis: pairingThesisDetailSchema,
  components: pairingComponentScoresSchema,
  pairingScore: z.number().min(0).max(100),
  lifecycleState: pairingLifecycleStateSchema,
  createdAt: timestampSchema,
});

// --- Pairing Decision (pairing_decisions table) ---
export const pairingDecisionActionSchema = z.enum([
  "STRONG_PAIR",
  "PROPOSED",
  "REJECTED",
]);

export const pairingDecisionRecordSchema = z.object({
  id: z.string().min(1),
  pairingCandidateId: z.string().min(1),
  decision: pairingDecisionActionSchema,
  confidence: z.number().min(0).max(100),
  createdAt: timestampSchema,
});

// --- Pairing History (pairing_history table) ---
export const pairingHistoryRecordSchema = z.object({
  id: z.string().min(1),
  pairingCandidateId: z.string().min(1),
  fromState: pairingLifecycleStateSchema,
  toState: pairingLifecycleStateSchema,
  actor: actorSchema,
  transitionedAt: timestampSchema,
});

// --- Launch Candidate (launch_candidates table) ---
export const launchCandidateRecordSchema = z.object({
  id: z.string().min(1),
  pairingCandidateId: z.string().min(1),
  stage: launchStageSchema,
  readiness: z.enum(["PREPARING", "READY", "PAUSED"]),
  checksPassed: z.number().int().nonnegative(),
  checksTotal: z.number().int().positive(),
  stageDeadlineAt: timestampSchema,
  transactionStatus: z.literal("NOT_SUBMITTED"),
});

// --- Launch Cycle Checklist Stage (launch_cycles table) ---
export const launchCycleStageRecordSchema = z.object({
  id: z.string().min(1),
  launchCandidateId: z.string().min(1),
  stageLabel: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["COMPLETE", "ACTIVE", "PENDING"]),
  completedAt: timestampSchema.nullable(),
});

// --- Memory Events (memory_events table) ---
export const memoryEventSubjectTypeSchema = z.enum([
  "ASSET",
  "PAIRING",
  "LAUNCH",
  "SYSTEM",
]);

export const memoryEventRecordSchema = z.object({
  id: z.string().min(1),
  subjectType: memoryEventSubjectTypeSchema,
  subjectId: z.string().min(1),
  cycleId: z.union([z.string().min(1), z.number().int().positive()]),
  previousState: z.record(z.string(), z.unknown()),
  observedChange: z.string().min(1),
  decision: z.string().nullable(),
  currentState: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(z.string()),
  recordedAt: timestampSchema,
});

// --- Protocol Events (protocol_events table) ---
export const protocolEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.union([eventTypeSchema, z.string().min(1)]),
  cycleId: z.union([z.string().min(1), z.number().int().positive()]).nullable(),
  subjectType: memoryEventSubjectTypeSchema.nullable().optional(),
  subjectId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  schemaVersion: z.number().int().positive(),
  actor: actorSchema.default("JEVO_AGENT"),
  createdAt: timestampSchema,
});

// --- Provider Health and Runs (provider_runs table) ---
export const providerHealthStatusSchema = z.enum([
  "HEALTHY",
  "DEGRADED",
  "DOWN",
]);

export const providerHealthSchema = z.object({
  provider: z.string().min(1),
  status: providerHealthStatusSchema,
  latencyMs: z.number().nonnegative(),
  lastSuccessAt: timestampSchema.nullable(),
  error: z.string().nullable().optional(),
  ranAt: timestampSchema,
});

export const providerRunRecordSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  status: providerHealthStatusSchema,
  latencyMs: z.number().nonnegative(),
  error: z.string().nullable(),
  ranAt: timestampSchema,
});

// --- Agent Config Versions (agent_config_versions table) ---
export const agentConfigVersionSchema = z.object({
  id: z.string().min(1),
  weights: z.record(z.string(), z.number()),
  jevModelVersion: z.string().min(1),
  jevPromptVersion: z.string().min(1),
  activeFrom: timestampSchema,
  createdBy: z.string().min(1),
});

// --- Meme Concept (meme_concepts table) ---
export const memeConceptSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: timestampSchema,
});

