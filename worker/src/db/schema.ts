import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  PairingComponentScores,
  PairingThesisDetail,
} from "@jevo/protocol-types";

// ============================================================================
// 1. ASSETS REGISTRY (assets table)
// ============================================================================
export const assets = pgTable("assets", {
  symbol: text("symbol").primaryKey(),
  name: text("name").notNull(),
  stockTokenAddress: text("stock_token_address").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 2. MARKET SNAPSHOTS (market_snapshots table)
// ============================================================================
export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    price: doublePrecision("price").notNull(),
    volume24h: doublePrecision("volume_24h").notNull(),
    volatility: doublePrecision("volatility").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    source: text("source").notNull(),
  },
  (table) => [
    index("idx_market_snapshots_symbol_captured_at").on(table.symbol, table.capturedAt.desc()),
  ],
);

// ============================================================================
// 3. SIGNAL OBSERVATIONS (signal_observations table)
// ============================================================================
export const signalObservations = pgTable(
  "signal_observations",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    kind: text("kind").notNull(), // NARRATIVE | SOCIAL | NEWS | ONCHAIN
    magnitude: doublePrecision("magnitude").notNull(), // 0 - 100
    label: text("label").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    source: text("source").notNull(),
  },
  (table) => [
    index("idx_signal_observations_symbol_captured_at").on(table.symbol, table.capturedAt.desc()),
    index("idx_signal_observations_kind").on(table.kind),
  ],
);

// ============================================================================
// 4. AGENT CYCLES (agent_cycles table)
// ============================================================================
export const agentCycles = pgTable("agent_cycles", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // DELTA | RANKING | FULL | NARRATIVE
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  assetsScanned: integer("assets_scanned").notNull().default(0),
  signalsProcessed: integer("signals_processed").notNull().default(0),
  status: text("status").notNull(), // RUNNING | COMPLETED | FAILED
});

// ============================================================================
// 5. JEV DECISIONS (jev_decisions table)
// Critical constraint: UNIQUE(cycle_id, symbol)
// ============================================================================
export const jevDecisions = pgTable(
  "jev_decisions",
  {
    id: text("id").primaryKey(),
    cycleId: text("cycle_id").notNull(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    decision: text("decision").notNull(), // PROMOTE | HOLD | DEMOTE
    confidence: doublePrecision("confidence").notNull(), // 0 - 100
    signals: jsonb("signals").notNull().$type<string[]>(),
    modelVersion: text("model_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_jev_decisions_cycle_symbol").on(table.cycleId, table.symbol),
  ],
);

// ============================================================================
// 6. OPPORTUNITY SCORES (opportunity_scores table)
// Composite PK: (cycle_id, symbol)
// ============================================================================
export const opportunityScores = pgTable(
  "opportunity_scores",
  {
    cycleId: text("cycle_id").notNull(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    marketMomentum: doublePrecision("market_momentum").notNull(),
    narrativeMomentum: doublePrecision("narrative_momentum").notNull(),
    socialVelocity: doublePrecision("social_velocity").notNull(),
    culturalRelevance: doublePrecision("cultural_relevance").notNull(),
    memeCompatibility: doublePrecision("meme_compatibility").notNull(),
    cryptoAdjacency: doublePrecision("crypto_adjacency").notNull(),
    pairCompatibility: doublePrecision("pair_compatibility").notNull(),
    score: doublePrecision("score").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cycleId, table.symbol] }),
  ],
);

// ============================================================================
// 7. RANK HISTORY (rank_history table)
// Critical constraint: PK / UNIQUE (cycle_id, symbol)
// ============================================================================
export const rankHistory = pgTable(
  "rank_history",
  {
    cycleId: text("cycle_id").notNull(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    currentRank: integer("current_rank").notNull(),
    previousRank: integer("previous_rank"),
    opportunityScore: doublePrecision("opportunity_score").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cycleId, table.symbol] }),
    index("idx_rank_history_symbol_cycle").on(table.symbol, table.cycleId.desc()),
    index("idx_rank_history_cycle_rank").on(table.cycleId, table.currentRank),
  ],
);

// ============================================================================
// 8. PAIRING CANDIDATES (pairing_candidates table)
// ============================================================================
export const pairingCandidates = pgTable(
  "pairing_candidates",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol")
      .notNull()
      .references(() => assets.symbol),
    memeSymbol: text("meme_symbol").notNull(),
    thesis: jsonb("thesis").notNull().$type<PairingThesisDetail>(),
    components: jsonb("components").notNull().$type<PairingComponentScores>(),
    pairingScore: doublePrecision("pairing_score").notNull(),
    lifecycleState: text("lifecycle_state").notNull(), // DETECTED | ANALYZED | PROPOSED | CURATED | LAUNCH_CANDIDATE | LAUNCHED | ARCHIVED
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_pairing_candidates_symbol").on(table.symbol),
    index("idx_pairing_candidates_lifecycle").on(table.lifecycleState),
  ],
);

// ============================================================================
// 9. PAIRING DECISIONS (pairing_decisions table)
// ============================================================================
export const pairingDecisions = pgTable(
  "pairing_decisions",
  {
    id: text("id").primaryKey(),
    pairingCandidateId: text("pairing_candidate_id")
      .notNull()
      .references(() => pairingCandidates.id),
    decision: text("decision").notNull(), // STRONG_PAIR | PROPOSED | REJECTED
    confidence: doublePrecision("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_pairing_decisions_candidate_created").on(table.pairingCandidateId, table.createdAt.desc()),
  ],
);

// ============================================================================
// 10. PAIRING HISTORY (pairing_history table)
// ============================================================================
export const pairingHistory = pgTable(
  "pairing_history",
  {
    id: text("id").primaryKey(),
    pairingCandidateId: text("pairing_candidate_id")
      .notNull()
      .references(() => pairingCandidates.id),
    fromState: text("from_state").notNull(),
    toState: text("to_state").notNull(),
    actor: text("actor").notNull(),
    transitionedAt: timestamp("transitioned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_pairing_history_candidate_transitioned").on(table.pairingCandidateId, table.transitionedAt),
  ],
);

// ============================================================================
// 11. LAUNCH CANDIDATES (launch_candidates table)
// ============================================================================
export const launchCandidates = pgTable("launch_candidates", {
  id: text("id").primaryKey(), // e.g. "LC-204"
  pairingCandidateId: text("pairing_candidate_id")
    .notNull()
    .unique()
    .references(() => pairingCandidates.id),
  stage: text("stage").notNull(), // CANDIDATE_SELECTED | ... | CONTROLLED_EXECUTION
  readiness: text("readiness").notNull(), // PREPARING | READY | PAUSED
  checksPassed: integer("checks_passed").notNull().default(0),
  checksTotal: integer("checks_total").notNull().default(8),
  stageDeadlineAt: timestamp("stage_deadline_at", { withTimezone: true }).notNull(),
  transactionStatus: text("transaction_status").notNull().default("NOT_SUBMITTED"),
});

// ============================================================================
// 12. LAUNCH CYCLES (launch_cycles table)
// ============================================================================
export const launchCycles = pgTable(
  "launch_cycles",
  {
    id: text("id").primaryKey(),
    launchCandidateId: text("launch_candidate_id")
      .notNull()
      .references(() => launchCandidates.id),
    stageLabel: text("stage_label").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull(), // COMPLETE | ACTIVE | PENDING
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_launch_cycles_candidate_stage").on(table.launchCandidateId, table.stageLabel),
  ],
);

// ============================================================================
// 13. MEMORY EVENTS (memory_events table)
// ============================================================================
export const memoryEvents = pgTable(
  "memory_events",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type").notNull(), // ASSET | PAIRING | LAUNCH | SYSTEM
    subjectId: text("subject_id").notNull(),
    cycleId: text("cycle_id").notNull(),
    previousState: jsonb("previous_state").notNull(),
    observedChange: text("observed_change").notNull(),
    decision: text("decision"),
    currentState: jsonb("current_state").notNull(),
    evidenceRefs: jsonb("evidence_refs").notNull().$type<string[]>(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_memory_events_subject_recorded").on(table.subjectType, table.subjectId, table.recordedAt.desc()),
  ],
);

// ============================================================================
// 14. PROTOCOL EVENTS (protocol_events table)
// ============================================================================
export const protocolEvents = pgTable(
  "protocol_events",
  {
    eventId: text("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    cycleId: text("cycle_id"),
    subjectType: text("subject_type"),
    subjectId: text("subject_id"),
    payload: jsonb("payload").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    actor: text("actor").notNull().default("JEVO_AGENT"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_protocol_events_created_at").on(table.createdAt.desc()),
    index("idx_protocol_events_event_type").on(table.eventType),
    index("idx_protocol_events_cycle_id").on(table.cycleId),
  ],
);

// ============================================================================
// 15. PROVIDER RUNS (provider_runs table)
// ============================================================================
export const providerRuns = pgTable(
  "provider_runs",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    status: text("status").notNull(), // HEALTHY | DEGRADED | DOWN
    latencyMs: integer("latency_ms").notNull(),
    error: text("error"),
    ranAt: timestamp("ran_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_provider_runs_provider_ran_at").on(table.provider, table.ranAt.desc()),
  ],
);

// ============================================================================
// 16. AGENT CONFIG VERSIONS (agent_config_versions table)
// ============================================================================
export const agentConfigVersions = pgTable("agent_config_versions", {
  id: text("id").primaryKey(),
  weights: jsonb("weights").notNull().$type<Record<string, number>>(),
  jevModelVersion: text("jev_model_version").notNull(),
  jevPromptVersion: text("jev_prompt_version").notNull(),
  activeFrom: timestamp("active_from", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
});

// ============================================================================
// 17. MEME CONCEPTS (meme_concepts table - team-curated)
// ============================================================================
export const memeConcepts = pgTable("meme_concepts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "$GPU"
  tags: jsonb("tags").notNull().$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
