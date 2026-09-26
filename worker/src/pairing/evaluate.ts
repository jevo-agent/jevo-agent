import { randomUUID } from "node:crypto";
import type {
  MemeConcept,
  PairingCandidateRecord,
  PairingComponentScores,
  PairingDecisionAction,
  PairingThesisDetail,
} from "@jevo/protocol-types";
import { db } from "../db/client";
import {
  pairingCandidates,
  pairingDecisions,
  pairingHistory,
  protocolEvents,
} from "../db/schema";
import { publishProtocolEvent } from "../events";
import { RealJevProviderError, type JevProvider } from "../jev";
import { logger } from "../observability/logger";
import {
  extractTagsFromSignals,
  findMemeConceptsByTagOverlap,
} from "./memeConcepts";

export interface PairingScoreWeights {
  narrative: number;
  cultural: number;
  meme: number;
  crypto: number;
  timing: number;
  stockRelevance: number;
}

export const DEFAULT_PAIRING_WEIGHTS: PairingScoreWeights = {
  narrative: 0.2,
  cultural: 0.15,
  meme: 0.2,
  crypto: 0.15,
  timing: 0.15,
  stockRelevance: 0.15,
};

/**
 * Section 10: Deterministic arithmetic for pairing score.
 * Jev only fills the 6 qualitative components; final blend is purely arithmetic.
 */
export function computePairingScore(
  scores: PairingComponentScores,
  weights: PairingScoreWeights = DEFAULT_PAIRING_WEIGHTS,
): number {
  const raw =
    scores.narrative * weights.narrative +
    scores.cultural * weights.cultural +
    scores.meme * weights.meme +
    scores.crypto * weights.crypto +
    scores.timing * weights.timing +
    scores.stockRelevance * weights.stockRelevance;

  return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100;
}

/**
 * Builds the structured 4-field pairing thesis per Section 10:
 * (whyStock, whyMeme, whyPair, whyNow)
 */
export function buildThesisText(params: {
  stockSymbol: string;
  conceptName: string;
  signals: string[];
  components: PairingComponentScores;
}): PairingThesisDetail {
  const { stockSymbol, conceptName, signals, components } = params;
  const primarySignal = signals[0] ?? `${stockSymbol} narrative acceleration`;

  return {
    whyStock: `${stockSymbol} exhibits high narrative velocity driven by: ${primarySignal}.`,
    whyMeme: `${conceptName} captures crypto-native cultural resonance with a meme score of ${components.meme}/100.`,
    whyPair: `The pair synthesizes equity momentum with decentralized community attention, showing ${components.cultural}/100 cultural alignment.`,
    whyNow: `Timing index is strong (${components.timing}/100) with favorable liquidity and catalyst density.`,
  };
}

export interface EvaluatePairingOptions {
  stockSymbol: string;
  narrativeSignals: string[];
  jev: JevProvider;
  weights?: PairingScoreWeights;
  client?: typeof db;
  cycleId?: string;
}

/**
 * Evaluates meme pairings for a qualified stock asset following Section 10:
 * 1. Tag-overlap lookup against curated meme_concepts table.
 * 2. If no concept matches, returns empty array without error.
 * 3. Jev evaluates thesis choice + 6 qualitative components per candidate.
 * 4. Deterministic arithmetic calculates pairingScore.
 * 5. All candidates are persisted to pairing_candidates with lifecycle_state = 'PROPOSED'.
 * 6. Initial state transition is logged to pairing_history.
 * 7. Does NOT auto-publish past 'PROPOSED' (curation is human-gated in BACKEND 10).
 */
export async function evaluatePairing(
  options: EvaluatePairingOptions,
): Promise<PairingCandidateRecord[]> {
  const {
    stockSymbol,
    narrativeSignals,
    jev,
    weights = DEFAULT_PAIRING_WEIGHTS,
    client = db,
    cycleId,
  } = options;

  const symbol = stockSymbol.toUpperCase();

  // 1. Extract keyword tags from symbol and narrative signals
  const queryTags = extractTagsFromSignals(symbol, narrativeSignals);

  // 2. Tag-overlap lookup to curated meme_concepts table
  const candidates = await findMemeConceptsByTagOverlap(queryTags, client, 4);

  if (candidates.length === 0) {
    logger.info(
      { symbol },
      "No matching meme concepts found in curated table. Clean return.",
    );
    return [];
  }

  logger.info(
    { symbol, candidateCount: candidates.length },
    "Found meme concept candidates. Evaluating pairing theses...",
  );

  const evaluatedCandidates: Array<{
    record: PairingCandidateRecord;
    decision: PairingDecisionAction;
    confidence: number;
  }> = [];

  for (const concept of candidates) {
    // 3. Jev evaluates choice: strong_pair | proposed | rejected
    const thesisChoice = await jev.evaluateChoice<PairingDecisionAction>({
      context: {
        symbol,
        stockSymbol: symbol,
        conceptId: concept.id,
        conceptName: concept.name,
        signals: narrativeSignals,
      },
      options: ["STRONG_PAIR", "PROPOSED", "REJECTED"],
    });

    // 4. Jev evaluates 6 qualitative component scores
    const componentScoresResult = await jev.evaluateScore({
      context: {
        symbol,
        stockSymbol: symbol,
        conceptName: concept.name,
      },
      dimensions: [
        "narrative",
        "cultural",
        "meme",
        "crypto",
        "timing",
        "stockRelevance",
      ],
    });

    const componentKeys = ["narrative", "cultural", "meme", "crypto", "timing", "stockRelevance"] as const;
    if (componentKeys.some((key) => typeof componentScoresResult.scores[key] !== "number")) {
      throw new RealJevProviderError(
        "INVALID_RESPONSE",
        `Jev response omitted a required pairing score dimension for ${symbol}`,
        false,
      );
    }
    const components: PairingComponentScores = {
      narrative: componentScoresResult.scores.narrative,
      cultural: componentScoresResult.scores.cultural,
      meme: componentScoresResult.scores.meme,
      crypto: componentScoresResult.scores.crypto,
      timing: componentScoresResult.scores.timing,
      stockRelevance: componentScoresResult.scores.stockRelevance,
    };

    // 5. Deterministic arithmetic for pairing score
    const pairingScore = computePairingScore(components, weights);

    // 6. Build structured 4-field thesis
    const thesis = buildThesisText({
      stockSymbol: symbol,
      conceptName: concept.name,
      signals: narrativeSignals,
      components,
    });

    const candidateId = `pc-${symbol.toLowerCase()}-${concept.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomUUID().slice(0, 8)}`;
    const now = new Date();

    const record: PairingCandidateRecord = {
      id: candidateId,
      symbol,
      memeSymbol: concept.name,
      thesis,
      components,
      pairingScore,
      lifecycleState: "PROPOSED",
      createdAt: now.toISOString(),
    };

    evaluatedCandidates.push({
      record,
      decision: thesisChoice.choice,
      confidence: thesisChoice.confidence,
    });
  }

  // Sort candidates by pairingScore DESC (tie-breaker: memeSymbol ASC)
  evaluatedCandidates.sort((a, b) => {
    if (b.record.pairingScore !== a.record.pairingScore) {
      return b.record.pairingScore - a.record.pairingScore;
    }
    return a.record.memeSymbol.localeCompare(b.record.memeSymbol);
  });

  // Persist all candidates (both primary winner and alternates)
  for (const item of evaluatedCandidates) {
    const { record, decision, confidence } = item;
    const createdAt = new Date(record.createdAt);

    // Write to pairing_candidates
    await client
      .insert(pairingCandidates)
      .values({
        id: record.id,
        symbol: record.symbol,
        memeSymbol: record.memeSymbol,
        thesis: record.thesis,
        components: record.components,
        pairingScore: record.pairingScore,
        lifecycleState: record.lifecycleState,
        createdAt,
      })
      .onConflictDoNothing();

    // Write to pairing_decisions
    await client
      .insert(pairingDecisions)
      .values({
        id: `pd-${record.id}-${randomUUID().slice(0, 8)}`,
        pairingCandidateId: record.id,
        decision,
        confidence,
        createdAt,
      })
      .onConflictDoNothing();

    // Record initial transition in pairing_history
    await client
      .insert(pairingHistory)
      .values({
        id: `ph-${record.id}-${randomUUID().slice(0, 8)}`,
        pairingCandidateId: record.id,
        fromState: "PROPOSED",
        toState: "PROPOSED",
        actor: "JEVO_AGENT",
        transitionedAt: createdAt,
      })
      .onConflictDoNothing();

    // Emit Section 12 PAIRING_PROPOSED protocol event
    const pairingEvt = {
      eventId: `evt-pairing-proposed-${record.id}`,
      eventType: "PAIRING_PROPOSED",
      cycleId: cycleId ?? null,
      subjectType: "pairing",
      subjectId: record.id,
      payload: {
        candidateId: record.id,
        symbol: record.symbol,
        memeSymbol: record.memeSymbol,
        pairingScore: record.pairingScore,
        lifecycleState: record.lifecycleState,
      },
      schemaVersion: 1,
      actor: "JEVO_AGENT" as const,
      createdAt: createdAt.toISOString(),
    };

    await client
      .insert(protocolEvents)
      .values({
        ...pairingEvt,
        createdAt,
      })
      .onConflictDoNothing();

    await publishProtocolEvent(pairingEvt);
  }

  logger.info(
    { symbol, totalEvaluated: evaluatedCandidates.length },
    "Persisted pairing candidates with lifecycleState='PROPOSED'",
  );

  return evaluatedCandidates.map((item) => item.record);
}

export interface RunPairingCycleOptions {
  cycleId: string;
  qualifiedAssets: Array<{
    symbol: string;
    narrativeSignals: string[];
  }>;
  jev: JevProvider;
  client?: typeof db;
}

/**
 * Executes pairing evaluation across qualified assets in an agent cycle (Steps 11–12).
 */
export async function runPairingCycle(
  options: RunPairingCycleOptions,
): Promise<PairingCandidateRecord[]> {
  const { cycleId, qualifiedAssets, jev, client = db } = options;
  const allProposed: PairingCandidateRecord[] = [];

  for (const asset of qualifiedAssets) {
    const candidates = await evaluatePairing({
      stockSymbol: asset.symbol,
      narrativeSignals: asset.narrativeSignals,
      jev,
      cycleId,
      client,
    });
    allProposed.push(...candidates);
  }

  return allProposed;
}
