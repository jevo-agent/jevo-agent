import { z } from "zod";

const timestampSchema = z.string().datetime({ offset: true });

export const agentStatusSchema = z.enum(["ONLINE", "PAUSED", "OFFLINE"]);
export const jevStatusSchema = z.enum(["ACTIVE", "IDLE", "PAUSED"]);
export const eventTypeSchema = z.enum([
  "OBSERVE",
  "SIGNAL",
  "JEV_DECISION",
  "PAIRING",
  "LAUNCH",
  "MEMORY",
  "POLICY",
  "ACTION",
]);
export const actorSchema = z.enum(["JEVO_AGENT", "OPERATOR", "LAUNCH_EXECUTOR"]);

export const agentEventSchema = z.object({
  id: z.string().min(1),
  timestamp: timestampSchema,
  type: eventTypeSchema,
  subject: z.string().min(1),
  summary: z.string().min(1),
});

export const agentRuntimeSchema = z.object({
  status: agentStatusSchema,
  jevStatus: jevStatusSchema,
  currentOperation: z.string().min(1),
  activeCycle: z.number().int().positive(),
  scanProgress: z.number().min(0).max(100),
  assetsScanned: z.number().int().nonnegative(),
  assetsInUniverse: z.number().int().positive(),
  signalsProcessed: z.number().int().nonnegative(),
  narrativesDetected: z.number().int().nonnegative(),
  materiallyChangedNarratives: z.number().int().nonnegative(),
  decisionsProcessed: z.number().int().nonnegative(),
  qualifiedCandidates: z.number().int().nonnegative(),
  highConvictionCandidates: z.number().int().nonnegative(),
  dataFreshness: z.string().min(1),
  lastScanAt: timestampSchema,
  lastDecisionAgeSeconds: z.number().int().nonnegative(),
  nextCycleInSeconds: z.number().int().nonnegative(),
  networkLabel: z.string().min(1),
  latestEvents: z.array(agentEventSchema).min(1),
});

export const signalSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  context: z.string().min(1),
  score: z.number().min(0).max(100),
  delta: z.number(),
  deltaLabel: z.string().min(1),
  state: z.string().min(1),
  source: z.string().min(1),
  dataAgeSeconds: z.number().int().nonnegative(),
  explanation: z.string().min(1),
});

export const decisionTraceSchema = z.object({
  id: z.string().min(1),
  timestamp: timestampSchema,
  type: eventTypeSchema,
  summary: z.string().min(1),
});

export const scoreHistoryPointSchema = z.object({
  timestamp: timestampSchema,
  score: z.number().min(0).max(100),
});

export const rankHistoryPointSchema = z.object({
  timestamp: timestampSchema,
  rank: z.number().int().positive(),
});

export const stockSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  currentRank: z.number().int().positive(),
  previousRank: z.number().int().positive(),
  opportunityScore: z.number().min(0).max(100),
  previousScore: z.number().min(0).max(100),
  rankMovement: z.number().int(),
  jevDecision: z.string().min(1),
  confidence: z.number().min(0).max(100),
  lastEvaluatedAt: timestampSchema,
  signals: z.array(signalSchema).min(1),
  scoreHistory: z.array(scoreHistoryPointSchema).min(1),
  rankHistory: z.array(rankHistoryPointSchema).min(1),
  decisionTrace: z.array(decisionTraceSchema).min(1),
});

export const pairingStatusSchema = z.enum([
  "AGENT_PROPOSED",
  "CURATED",
  "LAUNCH_CANDIDATE",
  "LAUNCHED",
]);
export const curationStateSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const pairingFactorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  delta: z.number(),
  state: z.string().min(1),
  source: z.string().min(1),
  explanation: z.string().min(1),
});
export const pairingAlternativeSchema = z.object({
  memeName: z.string().min(1),
  symbol: z.string().min(1),
  pairScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
});
export const pairingLifecycleSchema = z.object({
  stage: z.enum(["DETECTED", "ANALYZED", "PROPOSED", "CURATED", "LAUNCH_CANDIDATE", "LAUNCHED"]),
  status: z.enum(["COMPLETE", "ACTIVE", "PENDING"]),
  timestamp: timestampSchema.optional(),
});
export const pairingHistorySchema = z.object({
  timestamp: timestampSchema,
  summary: z.string().min(1),
  state: z.string().min(1),
});
export const pairingSchema = z.object({
  slug: z.string().min(1),
  stockSymbol: z.string().min(1),
  memeName: z.string().min(1),
  symbol: z.string().min(1),
  pairScore: z.number().min(0).max(100),
  jevDecision: z.string().min(1),
  confidence: z.number().min(0).max(100),
  status: pairingStatusSchema,
  thesis: z.object({
    core: z.string().min(1),
    whyStock: z.string().min(1),
    whyMeme: z.string().min(1),
    whyPair: z.string().min(1),
    whyNow: z.string().min(1),
  }),
  factors: z.array(pairingFactorSchema).min(1),
  alternatives: z.array(pairingAlternativeSchema),
  lifecycle: z.array(pairingLifecycleSchema).min(1),
  history: z.array(pairingHistorySchema).min(1),
  curationState: curationStateSchema,
});

export const launchStageSchema = z.enum([
  "CANDIDATE_SELECTED",
  "NARRATIVE_VALIDATION",
  "PAIRING_VALIDATION",
  "CONTRACT_PREPARATION",
  "FINAL_POLICY_CHECK",
  "CONTROLLED_EXECUTION",
]);
export const policyCheckSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["PASSED", "PENDING", "BLOCKED"]),
});
export const launchSchema = z.object({
  cycleId: z.string().min(1),
  selectedPairingSlug: z.string().min(1),
  stage: launchStageSchema,
  countdownSeconds: z.number().int().nonnegative(),
  readiness: z.enum(["READY", "PENDING", "BLOCKED"]),
  policyChecks: z.array(policyCheckSchema).min(1),
  guardianRequirement: z.object({ required: z.boolean(), status: z.enum(["REQUIRED", "AWAITING", "APPROVED"]) }),
  wallet: z.object({ displayAddress: z.string().min(1), permission: z.string().min(1), status: z.string().min(1) }),
  contracts: z.array(z.object({ label: z.string().min(1), displayAddress: z.string().min(1) })).min(1),
  transactionState: z.enum(["NOT_SUBMITTED", "PREPARING", "SUBMITTED", "CONFIRMED"]),
});

export const memoryRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.number().int().positive(),
  eventType: eventTypeSchema,
  subject: z.string().min(1),
  previousState: z.string().min(1),
  currentState: z.string().min(1),
  decision: z.string().min(1),
  structuredEvidence: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1),
  timestamp: timestampSchema,
  actor: actorSchema,
  summary: z.string().min(1),
});

export const protocolStateSchema = z.object({
  agent: agentRuntimeSchema,
  assets: z.array(stockSchema).min(1),
  ranking: z.array(z.string().min(1)).min(1),
  pairings: z.array(pairingSchema).min(1),
  launch: launchSchema,
  memory: z.array(memoryRecordSchema).min(1),
}).superRefine((state, context) => {
  const assetSymbols = new Set(state.assets.map((asset) => asset.symbol));
  const pairingSlugs = new Set(state.pairings.map((pairing) => pairing.slug));

  state.ranking.forEach((symbol, index) => {
    if (!assetSymbols.has(symbol)) {
      context.addIssue({ code: "custom", path: ["ranking", index], message: `Unknown ranked asset: ${symbol}` });
    }
  });

  state.pairings.forEach((pairing, index) => {
    if (!assetSymbols.has(pairing.stockSymbol)) {
      context.addIssue({ code: "custom", path: ["pairings", index, "stockSymbol"], message: `Unknown pairing stock: ${pairing.stockSymbol}` });
    }
  });

  if (!pairingSlugs.has(state.launch.selectedPairingSlug)) {
    context.addIssue({ code: "custom", path: ["launch", "selectedPairingSlug"], message: "Launch pairing must exist in the shared pairing dataset." });
  }
});
