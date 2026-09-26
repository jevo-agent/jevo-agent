import { z } from "zod";

const isoTimestamp = z.string().datetime({ offset: true });
const cycleId = z.union([z.string().min(1), z.number().int().positive()]);

export const agentApiSchema = z.object({
  status: z.enum(["ONLINE", "PAUSED", "OFFLINE"]),
  jevStatus: z.enum(["ACTIVE", "IDLE", "PAUSED"]),
  currentOperation: z.string(),
  activeCycle: z.union([z.string().min(1), z.number().int().positive()]).nullable(),
  scanProgress: z.number().min(0).max(100),
  assetsScanned: z.number().int().nonnegative(),
  assetsInUniverse: z.number().int().nonnegative().nullable(),
  signalsProcessed: z.number().int().nonnegative(),
  narrativesDetected: z.number().int().nonnegative().nullable(),
  materiallyChangedNarratives: z.number().int().nonnegative().nullable(),
  decisionsProcessed: z.number().int().nonnegative(),
  qualifiedCandidates: z.number().int().nonnegative(),
  highConvictionCandidates: z.number().int().nonnegative(),
  dataFreshness: z.string(),
  lastScanAt: isoTimestamp,
  lastDecisionAgeSeconds: z.number().int().nonnegative(),
  nextCycleInSeconds: z.number().int().nonnegative().nullable(),
  networkLabel: z.string().nullable(),
  latestEvents: z.array(z.object({
    id: z.string(),
    timestamp: isoTimestamp,
    type: z.enum(["OBSERVE", "SIGNAL", "JEV_DECISION", "PAIRING", "LAUNCH", "MEMORY", "POLICY", "ACTION"]),
    subject: z.string(),
    summary: z.string(),
  })),
}).passthrough();

export const scoreDetailApiSchema = z.object({
  symbol: z.string(),
  cycleId,
  marketMomentum: z.number().min(0).max(100).optional(),
  narrativeMomentum: z.number().min(0).max(100).optional(),
  socialVelocity: z.number().min(0).max(100).optional(),
  culturalRelevance: z.number().min(0).max(100).optional(),
  memeCompatibility: z.number().min(0).max(100).optional(),
  cryptoAdjacency: z.number().min(0).max(100).optional(),
  pairCompatibility: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100),
  recordedAt: isoTimestamp.optional(),
}).passthrough();

export const opportunityHistoryApiSchema = z.object({
  cycleId: cycleId.optional(),
  currentRank: z.number().int().positive().optional(),
  rank: z.number().int().positive().optional(),
  score: z.number().min(0).max(100),
  recordedAt: isoTimestamp,
  dimensions: scoreDetailApiSchema.optional(),
}).passthrough();

export const opportunityApiSchema = z.object({
  cycleId,
  symbol: z.string().min(1),
  currentRank: z.number().int().positive(),
  previousRank: z.number().int().positive().nullable(),
  opportunityScore: z.number().min(0).max(100),
  previousScore: z.number().min(0).max(100).nullable().optional(),
  recordedAt: isoTimestamp,
  decision: z.string().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
  score: scoreDetailApiSchema.optional(),
  asset: z.object({ symbol: z.string(), name: z.string(), active: z.boolean().optional() }).optional(),
  history: z.array(opportunityHistoryApiSchema).optional(),
}).passthrough();

export const pairingApiSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  memeSymbol: z.string().min(1),
  thesis: z.object({
    core: z.string().optional(),
    whyStock: z.string().optional(),
    whyMeme: z.string().optional(),
    whyPair: z.string().optional(),
    whyNow: z.string().optional(),
  }).passthrough(),
  components: z.union([
    z.object({
      narrative: z.number().min(0).max(100).optional(),
      cultural: z.number().min(0).max(100).optional(),
      meme: z.number().min(0).max(100).optional(),
      crypto: z.number().min(0).max(100).optional(),
      timing: z.number().min(0).max(100).optional(),
      stockRelevance: z.number().min(0).max(100).optional(),
    }).passthrough(),
    z.array(z.object({ label: z.string(), score: z.number().min(0).max(100) }).passthrough()),
  ]),
  pairingScore: z.number().min(0).max(100),
  lifecycleState: z.string(),
  createdAt: isoTimestamp,
  decision: z.string().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
  history: z.array(z.object({ fromState: z.string(), toState: z.string(), actor: z.string(), transitionedAt: isoTimestamp }).passthrough()).optional(),
  alternates: z.array(z.unknown()).optional(),
}).passthrough();

export const launchApiSchema = z.object({
  id: z.string().optional(),
  cycleId: z.string().optional(),
  pairingCandidateId: z.string().optional(),
  selectedPairingSlug: z.string().optional(),
  stage: z.string(),
  readiness: z.string(),
  checksPassed: z.number().int().nonnegative().optional(),
  checksTotal: z.number().int().positive().optional(),
  stageDeadlineAt: isoTimestamp.optional(),
  transactionStatus: z.string().optional(),
  countdownSeconds: z.number().int().nonnegative().optional(),
  stages: z.array(z.unknown()).optional(),
  policyChecks: z.array(z.unknown()).optional(),
  guardianRequirement: z.unknown().optional(),
  wallet: z.unknown().optional(),
  contracts: z.array(z.unknown()).optional(),
  token: z.unknown().optional(),
  activity: z.array(z.unknown()).optional(),
  transactionState: z.string().optional(),
}).passthrough();

export const stockApiSchema = z.object({
  asset: z.object({ symbol: z.string(), name: z.string(), active: z.boolean().optional() }).passthrough(),
  current: z.object({
    rank: z.number().int().positive(),
    previousRank: z.number().int().positive().nullable(),
    score: scoreDetailApiSchema.nullable(),
    decision: z.object({ decision: z.string(), confidence: z.number().min(0).max(100).nullable().optional(), createdAt: isoTimestamp.optional(), signals: z.array(z.string()).optional() }).nullable(),
  }).passthrough(),
  rankHistory: z.array(z.object({ currentRank: z.number().int().positive(), previousRank: z.number().int().positive().nullable(), opportunityScore: z.number().min(0).max(100), recordedAt: isoTimestamp, cycleId: cycleId, symbol: z.string().optional() }).passthrough()),
  scoreHistory: z.array(scoreDetailApiSchema.extend({ recordedAt: isoTimestamp.optional() }).passthrough()),
  recentEvents: z.array(z.object({ id: z.string(), subjectId: z.string(), decision: z.string().nullable().optional(), observedChange: z.string(), recordedAt: isoTimestamp }).passthrough()),
  openPairings: z.array(pairingApiSchema),
}).passthrough();

export const memoryApiSchema = z.object({
  id: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
  cycleId: cycleId,
  previousState: z.record(z.string(), z.unknown()),
  observedChange: z.string(),
  decision: z.string().nullable(),
  currentState: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(z.string()),
  recordedAt: isoTimestamp,
}).passthrough();

export const cycleApiSchema = z.object({
  id: cycleId,
  kind: z.string(),
  startedAt: isoTimestamp,
  completedAt: isoTimestamp.nullable(),
  assetsScanned: z.number().int().nonnegative(),
  signalsProcessed: z.number().int().nonnegative(),
  status: z.string(),
}).passthrough();

export const protocolEventApiSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  cycleId: cycleId.nullable(),
  subjectType: z.string().nullable().optional(),
  subjectId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  schemaVersion: z.number().int().positive(),
  actor: z.string(),
  createdAt: isoTimestamp,
}).passthrough();
