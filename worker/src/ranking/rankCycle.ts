import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db/client";
import { opportunityScores, rankHistory } from "../db/schema";
import { logger } from "../observability/logger";
import {
  buildOpportunityComponents,
  computeOpportunityScore,
  type OpportunityComponents,
  type QualitativeJevScores,
  type RawMarketDataInput,
  type RawSocialDataInput,
} from "./computeScore";
import { getActiveWeights, type ScoreWeights } from "./weights";

export interface AssetToRank {
  symbol: string;
  marketInput?: RawMarketDataInput;
  socialInput?: RawSocialDataInput;
  jevScores?: QualitativeJevScores;
  // Or precomputed components if already assembled
  components?: OpportunityComponents;
}

export interface RankedAssetResult {
  symbol: string;
  currentRank: number;
  previousRank: number | null;
  rankDelta: number | null; // Positive: climbed in rank (+1 means climbed from 2 to 1). Negative: dropped.
  opportunityScore: number;
  components: OpportunityComponents;
}

export interface CycleRankingOptions {
  cycleId: string;
  previousCycleId?: string | null;
  assets: AssetToRank[];
  client?: typeof db;
}

export interface CycleRankingSummary {
  cycleId: string;
  configVersionId: string;
  weights: ScoreWeights;
  rankedAssets: RankedAssetResult[];
  recordedAt: Date;
}

/**
 * Looks up the prior rank for a list of symbols from rank_history.
 * - If previousCycleId is explicitly null, treats as first cycle (no prior ranks).
 * - If previousCycleId is provided as a string, fetches ranks specifically from that cycle.
 * - If undefined, fetches each symbol's most recently recorded rank prior to currentCycleId.
 */
export async function lookupPreviousRanks(
  symbols: string[],
  currentCycleId: string,
  previousCycleId?: string | null,
  client = db,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (symbols.length === 0 || previousCycleId === null) return result;

  if (previousCycleId) {
    const rows = await client
      .select({
        symbol: rankHistory.symbol,
        currentRank: rankHistory.currentRank,
      })
      .from(rankHistory)
      .where(
        and(
          eq(rankHistory.cycleId, previousCycleId),
          inArray(rankHistory.symbol, symbols),
        ),
      );

    for (const row of rows) {
      result.set(row.symbol, row.currentRank);
    }
    return result;
  }

  // Look up most recent rank where cycleId != currentCycleId
  const rows = await client
    .select({
      symbol: rankHistory.symbol,
      currentRank: rankHistory.currentRank,
      cycleId: rankHistory.cycleId,
      recordedAt: rankHistory.recordedAt,
    })
    .from(rankHistory)
    .where(
      and(
        ne(rankHistory.cycleId, currentCycleId),
        inArray(rankHistory.symbol, symbols),
      ),
    )
    .orderBy(desc(rankHistory.recordedAt));

  for (const row of rows) {
    if (!result.has(row.symbol)) {
      result.set(row.symbol, row.currentRank);
    }
  }

  return result;
}

/**
 * BACKEND 04 — Core Scoring & Ranking Engine.
 *
 * Evaluates assets for a cycle:
 * 1. Reads dynamic weights from agent_config_versions (never hardcoded).
 * 2. Assembles OpportunityComponents (deterministic normalizers + Jev's 5 qualitative dimensions).
 * 3. Computes the composite Opportunity Score via pure deterministic arithmetic.
 *    (Jev NEVER touches the composite score).
 * 4. Sorts deterministically by score DESC (tie-breaker: symbol ASC).
 * 5. Queries previousRank from previous cycle in rank_history.
 * 6. Idempotently writes to opportunity_scores and rank_history.
 */
export async function rankCycle(options: CycleRankingOptions): Promise<CycleRankingSummary> {
  const { cycleId, previousCycleId, assets, client = db } = options;

  logger.info({ cycleId, assetCount: assets.length }, "Executing ranking cycle...");

  // 1. Read active weights from agent_config_versions
  const activeConfig = await getActiveWeights(client);
  const weights = activeConfig.weights;

  // 2. Compute opportunity components & scores for all assets
  const scoredAssets = assets.map((asset) => {
    let components: OpportunityComponents;

    if (asset.components) {
      components = asset.components;
    } else if (asset.marketInput && asset.socialInput && asset.jevScores) {
      components = buildOpportunityComponents({
        marketInput: asset.marketInput,
        socialInput: asset.socialInput,
        jevScores: asset.jevScores,
      });
    } else {
      throw new Error(
        `Asset ${asset.symbol} is missing required scoring inputs (marketInput, socialInput, jevScores, or components)`,
      );
    }

    const opportunityScore = computeOpportunityScore(components, weights);

    return {
      symbol: asset.symbol,
      opportunityScore,
      components,
    };
  });

  // 3. Deterministic Sort:
  // Primary: opportunityScore DESC
  // Tie-breaker: symbol ASC (guarantees 100% determinism)
  scoredAssets.sort((a, b) => {
    if (b.opportunityScore !== a.opportunityScore) {
      return b.opportunityScore - a.opportunityScore;
    }
    return a.symbol.localeCompare(b.symbol);
  });

  // 4. Lookup previous ranks from rank_history
  const symbols = scoredAssets.map((a) => a.symbol);
  const previousRanks = await lookupPreviousRanks(symbols, cycleId, previousCycleId, client);

  // 5. Build final ranked records with 1-based ranks and rank deltas
  const rankedAssets: RankedAssetResult[] = scoredAssets.map((item, index) => {
    const currentRank = index + 1;
    const previousRank = previousRanks.get(item.symbol) ?? null;
    // Rank delta: was #3, now #1 -> 3 - 1 = +2 (climbed 2 spots)
    const rankDelta = previousRank !== null ? previousRank - currentRank : null;

    return {
      symbol: item.symbol,
      currentRank,
      previousRank,
      rankDelta,
      opportunityScore: item.opportunityScore,
      components: item.components,
    };
  });

  const recordedAt = new Date();

  // 6. Idempotently persist to opportunity_scores
  if (rankedAssets.length > 0) {
    await client
      .insert(opportunityScores)
      .values(
        rankedAssets.map((item) => ({
          cycleId,
          symbol: item.symbol,
          marketMomentum: item.components.marketMomentum,
          narrativeMomentum: item.components.narrativeMomentum,
          socialVelocity: item.components.socialVelocity,
          culturalRelevance: item.components.culturalRelevance,
          memeCompatibility: item.components.memeCompatibility,
          cryptoAdjacency: item.components.cryptoAdjacency,
          pairCompatibility: item.components.pairCompatibility,
          score: item.opportunityScore,
        })),
      )
      .onConflictDoUpdate({
        target: [opportunityScores.cycleId, opportunityScores.symbol],
        set: {
          marketMomentum: sql`excluded.market_momentum`,
          narrativeMomentum: sql`excluded.narrative_momentum`,
          socialVelocity: sql`excluded.social_velocity`,
          culturalRelevance: sql`excluded.cultural_relevance`,
          memeCompatibility: sql`excluded.meme_compatibility`,
          cryptoAdjacency: sql`excluded.crypto_adjacency`,
          pairCompatibility: sql`excluded.pair_compatibility`,
          score: sql`excluded.score`,
        },
      });

    // 7. Idempotently persist to rank_history
    await client
      .insert(rankHistory)
      .values(
        rankedAssets.map((item) => ({
          cycleId,
          symbol: item.symbol,
          currentRank: item.currentRank,
          previousRank: item.previousRank,
          opportunityScore: item.opportunityScore,
          recordedAt,
        })),
      )
      .onConflictDoUpdate({
        target: [rankHistory.cycleId, rankHistory.symbol],
        set: {
          currentRank: sql`excluded.current_rank`,
          previousRank: sql`excluded.previous_rank`,
          opportunityScore: sql`excluded.opportunity_score`,
          recordedAt: sql`excluded.recorded_at`,
        },
      });
  }

  logger.info(
    {
      cycleId,
      topSymbol: rankedAssets[0]?.symbol,
      topScore: rankedAssets[0]?.opportunityScore,
    },
    "Ranking cycle completed and persisted successfully",
  );

  return {
    cycleId,
    configVersionId: activeConfig.configId,
    weights,
    rankedAssets,
    recordedAt,
  };
}
