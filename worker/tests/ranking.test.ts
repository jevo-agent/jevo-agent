import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db/client";
import { agentConfigVersions, opportunityScores, rankHistory } from "../src/db/schema";
import {
  computeMarketMomentum,
  computeOpportunityScore,
  computeSocialVelocity,
  createConfigVersion,
  DEFAULT_SCORE_WEIGHTS,
  getActiveWeights,
  rankCycle,
  scoreWeightsSchema,
  type OpportunityComponents,
  type ScoreWeights,
} from "../src/ranking";

describe("Scoring & Ranking Engine (BACKEND 04)", () => {
  const testCycle1 = "cycle-ranking-test-01";
  const testCycle2 = "cycle-ranking-test-02";

  beforeAll(async () => {
    // Ensure clean state for test configs and cycles
    await db
      .delete(agentConfigVersions)
      .where(eq(agentConfigVersions.createdBy, "OPERATOR"));
    await db
      .delete(rankHistory)
      .where(inArray(rankHistory.cycleId, [testCycle1, testCycle2]));
    await db
      .delete(opportunityScores)
      .where(inArray(opportunityScores.cycleId, [testCycle1, testCycle2]));
  });

  afterAll(async () => {
    // Clean up test rows
    await db
      .delete(agentConfigVersions)
      .where(eq(agentConfigVersions.createdBy, "OPERATOR"));
    await db
      .delete(rankHistory)
      .where(inArray(rankHistory.cycleId, [testCycle1, testCycle2]));
    await db
      .delete(opportunityScores)
      .where(inArray(opportunityScores.cycleId, [testCycle1, testCycle2]));
  });

  describe("Weights Management & agent_config_versions", () => {
    it("validates that weights must sum to 1.0", () => {
      expect(() =>
        scoreWeightsSchema.parse({
          ...DEFAULT_SCORE_WEIGHTS,
          marketMomentum: 0.5, // Sum becomes 1.35
        }),
      ).toThrow("Weights must sum to 1.0");

      const valid = scoreWeightsSchema.parse(DEFAULT_SCORE_WEIGHTS);
      expect(valid.marketMomentum).toBe(0.15);
    });

    it("reads active weights from agent_config_versions table", async () => {
      const active = await getActiveWeights();
      expect(active.configId).toBeDefined();
      expect(active.weights).toBeDefined();
      expect(active.weights.marketMomentum).toBe(0.15);
      expect(active.weights.narrativeMomentum).toBe(0.2);
    });

    it("creates a new config version and reads it dynamically", async () => {
      const customVersionId = `config-test-${Date.now()}`;
      const customWeights: ScoreWeights = {
        marketMomentum: 0.3,
        narrativeMomentum: 0.2,
        socialVelocity: 0.1,
        culturalRelevance: 0.1,
        memeCompatibility: 0.1,
        cryptoAdjacency: 0.1,
        pairCompatibility: 0.1,
      };

      await createConfigVersion({
        id: customVersionId,
        weights: customWeights,
        createdBy: "TEST_SUITE",
      });

      const active = await getActiveWeights();
      expect(active.configId).toBe(customVersionId);
      expect(active.weights.marketMomentum).toBe(0.3);

      // Clean up test config row
      await db
        .delete(agentConfigVersions)
        .where(eq(agentConfigVersions.id, customVersionId));
    });
  });

  describe("(a) Determinism Test", () => {
    it("computeOpportunityScore produces byte-identical output across 100 repeated runs", () => {
      const components: OpportunityComponents = {
        marketMomentum: 88.45,
        narrativeMomentum: 95.12,
        socialVelocity: 82.67,
        culturalRelevance: 91.33,
        memeCompatibility: 79.84,
        cryptoAdjacency: 85.5,
        pairCompatibility: 93.2,
      };

      const weights = DEFAULT_SCORE_WEIGHTS;

      const firstScore = computeOpportunityScore(components, weights);

      for (let i = 0; i < 100; i++) {
        const score = computeOpportunityScore(components, weights);
        expect(score).toBe(firstScore);
      }
    });

    it("deterministic normalizers produce identical outputs for identical inputs", () => {
      const marketInput = {
        current: { price: 150.5, volume24h: 35000000, volatility: 0.32 },
        previous: { price: 140.0, volume24h: 30000000, volatility: 0.3 },
      };

      const score1 = computeMarketMomentum(marketInput);
      const score2 = computeMarketMomentum(marketInput);
      expect(score1).toBe(score2);

      const socialInput = {
        observations: [
          { magnitude: 70, capturedAt: "2026-09-25T10:00:00Z" },
          { magnitude: 86, capturedAt: "2026-09-25T11:00:00Z" },
        ],
      };

      const vel1 = computeSocialVelocity(socialInput);
      const vel2 = computeSocialVelocity(socialInput);
      expect(vel1).toBe(vel2);
    });

    it("Jev is isolated: Jev never touches final score arithmetic", () => {
      // Jev only provides the 5 qualitative judgments; final composite is pure arithmetic
      const jevScores = {
        narrativeMomentum: 95,
        culturalRelevance: 90,
        memeCompatibility: 85,
        cryptoAdjacency: 80,
        pairCompatibility: 90,
      };

      const components: OpportunityComponents = {
        marketMomentum: 70, // Deterministic
        socialVelocity: 80, // Deterministic
        ...jevScores,
      };

      const weights: ScoreWeights = {
        marketMomentum: 0.15,
        narrativeMomentum: 0.2,
        socialVelocity: 0.15,
        culturalRelevance: 0.15,
        memeCompatibility: 0.15,
        cryptoAdjacency: 0.1,
        pairCompatibility: 0.1,
      };

      const expected =
        70 * 0.15 +
        95 * 0.2 +
        80 * 0.15 +
        90 * 0.15 +
        85 * 0.15 +
        80 * 0.1 +
        90 * 0.1;
      // 10.5 + 19.0 + 12.0 + 13.5 + 12.75 + 8.0 + 9.0 = 84.75

      const computed = computeOpportunityScore(components, weights);
      expect(computed).toBe(84.75);
    });
  });

  describe("(b) Two-Cycle Rank-Delta Test Against Fixture Math", () => {
    it("matches exact manual fixture math across two consecutive cycles and computes rank-deltas", async () => {
      // Standard weights fixture:
      // marketMomentum: 0.15, narrativeMomentum: 0.20, socialVelocity: 0.15,
      // culturalRelevance: 0.15, memeCompatibility: 0.15, cryptoAdjacency: 0.10, pairCompatibility: 0.10
      // Sum = 1.00

      // ======================================================================
      // CYCLE 1:
      // NVDA:
      // 90*0.15 + 95*0.20 + 85*0.15 + 90*0.15 + 92*0.15 + 80*0.10 + 90*0.10
      // = 13.50 + 19.00 + 12.75 + 13.50 + 13.80 + 8.00 + 9.00 = 89.55
      // TSLA:
      // 80*0.15 + 85*0.20 + 80*0.15 + 85*0.15 + 80*0.15 + 70*0.10 + 80*0.10
      // = 12.00 + 17.00 + 12.00 + 12.75 + 12.00 + 7.00 + 8.00 = 80.75
      // GME:
      // 70*0.15 + 75*0.20 + 90*0.15 + 85*0.15 + 95*0.15 + 65*0.10 + 75*0.10
      // = 10.50 + 15.00 + 13.50 + 12.75 + 14.25 + 6.50 + 7.50 = 80.00
      // Expected Ranks:
      // 1. NVDA (89.55, prev: null)
      // 2. TSLA (80.75, prev: null)
      // 3. GME  (80.00, prev: null)
      // ======================================================================

      const cycle1Assets = [
        {
          symbol: "NVDA",
          components: {
            marketMomentum: 90,
            narrativeMomentum: 95,
            socialVelocity: 85,
            culturalRelevance: 90,
            memeCompatibility: 92,
            cryptoAdjacency: 80,
            pairCompatibility: 90,
          },
        },
        {
          symbol: "TSLA",
          components: {
            marketMomentum: 80,
            narrativeMomentum: 85,
            socialVelocity: 80,
            culturalRelevance: 85,
            memeCompatibility: 80,
            cryptoAdjacency: 70,
            pairCompatibility: 80,
          },
        },
        {
          symbol: "GME",
          components: {
            marketMomentum: 70,
            narrativeMomentum: 75,
            socialVelocity: 90,
            culturalRelevance: 85,
            memeCompatibility: 95,
            cryptoAdjacency: 65,
            pairCompatibility: 75,
          },
        },
      ];

      const result1 = await rankCycle({
        cycleId: testCycle1,
        previousCycleId: null, // Explicitly no previous cycle (cycle 1)
        assets: cycle1Assets,
      });

      // Verify Cycle 1 results
      expect(result1.rankedAssets.length).toBe(3);

      const nvda1 = result1.rankedAssets.find((a) => a.symbol === "NVDA")!;
      const tsla1 = result1.rankedAssets.find((a) => a.symbol === "TSLA")!;
      const gme1 = result1.rankedAssets.find((a) => a.symbol === "GME")!;

      expect(nvda1.currentRank).toBe(1);
      expect(nvda1.opportunityScore).toBe(89.55);
      expect(nvda1.previousRank).toBeNull();
      expect(nvda1.rankDelta).toBeNull();

      expect(tsla1.currentRank).toBe(2);
      expect(tsla1.opportunityScore).toBe(80.75);
      expect(tsla1.previousRank).toBeNull();

      expect(gme1.currentRank).toBe(3);
      expect(gme1.opportunityScore).toBe(80.0);
      expect(gme1.previousRank).toBeNull();

      // Verify Cycle 1 persisted in DB
      const dbScores1 = await db
        .select()
        .from(opportunityScores)
        .where(eq(opportunityScores.cycleId, testCycle1));
      expect(dbScores1.length).toBe(3);

      const dbRanks1 = await db
        .select()
        .from(rankHistory)
        .where(eq(rankHistory.cycleId, testCycle1));
      expect(dbRanks1.length).toBe(3);

      // ======================================================================
      // CYCLE 2:
      // GME surges:
      // 95*0.15 + 90*0.20 + 98*0.15 + 96*0.15 + 98*0.15 + 80*0.10 + 90*0.10
      // = 14.25 + 18.00 + 14.70 + 14.40 + 14.70 + 8.00 + 9.00 = 93.05
      // NVDA remains stable:
      // 89.55
      // TSLA drops:
      // 65*0.15 + 70*0.20 + 65*0.15 + 75*0.15 + 70*0.15 + 60*0.10 + 70*0.10
      // = 9.75 + 14.00 + 9.75 + 11.25 + 10.50 + 6.00 + 7.00 = 68.25
      // Expected Ranks:
      // 1. GME  (93.05, previousRank: 3, rankDelta: +2 -> climbed 2 spots!)
      // 2. NVDA (89.55, previousRank: 1, rankDelta: -1 -> dropped 1 spot)
      // 3. TSLA (68.25, previousRank: 2, rankDelta: -1 -> dropped 1 spot)
      // ======================================================================

      const cycle2Assets = [
        {
          symbol: "GME",
          components: {
            marketMomentum: 95,
            narrativeMomentum: 90,
            socialVelocity: 98,
            culturalRelevance: 96,
            memeCompatibility: 98,
            cryptoAdjacency: 80,
            pairCompatibility: 90,
          },
        },
        {
          symbol: "NVDA",
          components: {
            marketMomentum: 90,
            narrativeMomentum: 95,
            socialVelocity: 85,
            culturalRelevance: 90,
            memeCompatibility: 92,
            cryptoAdjacency: 80,
            pairCompatibility: 90,
          },
        },
        {
          symbol: "TSLA",
          components: {
            marketMomentum: 65,
            narrativeMomentum: 70,
            socialVelocity: 65,
            culturalRelevance: 75,
            memeCompatibility: 70,
            cryptoAdjacency: 60,
            pairCompatibility: 70,
          },
        },
      ];

      const result2 = await rankCycle({
        cycleId: testCycle2,
        previousCycleId: testCycle1,
        assets: cycle2Assets,
      });

      expect(result2.rankedAssets.length).toBe(3);

      const gme2 = result2.rankedAssets.find((a) => a.symbol === "GME")!;
      const nvda2 = result2.rankedAssets.find((a) => a.symbol === "NVDA")!;
      const tsla2 = result2.rankedAssets.find((a) => a.symbol === "TSLA")!;

      // Check Rank 1: GME
      expect(gme2.currentRank).toBe(1);
      expect(gme2.previousRank).toBe(3);
      expect(gme2.rankDelta).toBe(2); // Climbed 2 spots (3 - 1)
      expect(gme2.opportunityScore).toBe(93.05);

      // Check Rank 2: NVDA
      expect(nvda2.currentRank).toBe(2);
      expect(nvda2.previousRank).toBe(1);
      expect(nvda2.rankDelta).toBe(-1); // Dropped 1 spot (1 - 2)
      expect(nvda2.opportunityScore).toBe(89.55);

      // Check Rank 3: TSLA
      expect(tsla2.currentRank).toBe(3);
      expect(tsla2.previousRank).toBe(2);
      expect(tsla2.rankDelta).toBe(-1); // Dropped 1 spot (2 - 3)
      expect(tsla2.opportunityScore).toBe(68.25);

      // Verify exact database records in rank_history for Cycle 2
      const dbRanks2 = await db
        .select()
        .from(rankHistory)
        .where(eq(rankHistory.cycleId, testCycle2));

      expect(dbRanks2.length).toBe(3);

      const gmeDb = dbRanks2.find((r) => r.symbol === "GME")!;
      expect(gmeDb.currentRank).toBe(1);
      expect(gmeDb.previousRank).toBe(3);
      expect(gmeDb.opportunityScore).toBe(93.05);

      const nvdaDb = dbRanks2.find((r) => r.symbol === "NVDA")!;
      expect(nvdaDb.currentRank).toBe(2);
      expect(nvdaDb.previousRank).toBe(1);
      expect(nvdaDb.opportunityScore).toBe(89.55);

      const tslaDb = dbRanks2.find((r) => r.symbol === "TSLA")!;
      expect(tslaDb.currentRank).toBe(3);
      expect(tslaDb.previousRank).toBe(2);
      expect(tslaDb.opportunityScore).toBe(68.25);
    });

    it("re-running rankCycle for the same cycleId is idempotent and preserves row uniqueness", async () => {
      const cycle2Assets = [
        {
          symbol: "GME",
          components: {
            marketMomentum: 95,
            narrativeMomentum: 90,
            socialVelocity: 98,
            culturalRelevance: 96,
            memeCompatibility: 98,
            cryptoAdjacency: 80,
            pairCompatibility: 90,
          },
        },
      ];

      // Run second time for testCycle2
      await rankCycle({
        cycleId: testCycle2,
        previousCycleId: testCycle1,
        assets: cycle2Assets,
      });

      const gmeRows = await db
        .select()
        .from(rankHistory)
        .where(
          and(
            eq(rankHistory.cycleId, testCycle2),
            eq(rankHistory.symbol, "GME"),
          ),
        );

      expect(gmeRows.length).toBe(1);
      expect(gmeRows[0].currentRank).toBe(1);
      expect(gmeRows[0].previousRank).toBe(3);
    });
  });
});
