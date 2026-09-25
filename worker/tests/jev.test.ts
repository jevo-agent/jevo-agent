import { afterAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { jevDecisions } from "../src/db/schema";
import {
  createDecisionEngine,
  DecisionEngine,
  MockJevProvider,
  rawJevChoiceResultSchema,
  rawJevScoreResultSchema,
} from "../src/jev";

describe("Jev Adapter & DecisionEngine (BACKEND 03)", () => {
  const testCycleId = "cycle-jev-idempotency-test";

  afterAll(async () => {
    await db.delete(jevDecisions).where(eq(jevDecisions.cycleId, testCycleId));
  });

  describe("Jev Schema Battery & Reasoning Stripping", () => {
    it("parses valid choice and normalizes 0-1 confidence to 0-100", () => {
      const raw = {
        choice: "promote",
        confidence: 0.94,
        signals: ["AI infrastructure accelerating"],
      };

      const parsed = rawJevChoiceResultSchema.parse(raw);
      expect(parsed.choice).toBe("PROMOTE");
      expect(parsed.confidence).toBe(94);
      expect(parsed.signals).toEqual(["AI infrastructure accelerating"]);
    });

    it("STRICTLY STRIPS free-text reasoning and chain-of-thought fields", () => {
      const rawWithThoughts = {
        choice: "promote",
        confidence: 94,
        signals: ["Signal 1", "Signal 2"],
        reasoning: "I think NVDA has great potential because...",
        thought: "Internal model monologue that should not be persisted",
        chainOfThought: ["Step 1", "Step 2"],
        explanation: "Because of reasons...",
      };

      const parsed = rawJevChoiceResultSchema.parse(rawWithThoughts);

      // Verify the parsed object only contains the allowed fields
      expect(Object.keys(parsed).sort()).toEqual(["choice", "confidence", "signals"]);
      expect((parsed as any).reasoning).toBeUndefined();
      expect((parsed as any).thought).toBeUndefined();
      expect((parsed as any).chainOfThought).toBeUndefined();
      expect((parsed as any).explanation).toBeUndefined();
    });

    it("rejects malformed Jev choice payload", () => {
      expect(() => rawJevChoiceResultSchema.parse({})).toThrow();
      expect(() => rawJevChoiceResultSchema.parse({ choice: "", confidence: 80 })).toThrow();
    });

    it("parses and clamps qualitative scores to 0-100 range", () => {
      const rawScores = {
        scores: {
          narrativeMomentum: 110, // out of bounds
          culturalRelevance: 95,
          memeCompatibility: -10, // out of bounds
        },
        confidence: 0.88,
        thought: "Clamping thoughts",
      };

      const parsed = rawJevScoreResultSchema.parse(rawScores);
      expect(parsed.confidence).toBe(88);
      expect(parsed.scores.narrativeMomentum).toBe(100);
      expect(parsed.scores.culturalRelevance).toBe(95);
      expect(parsed.scores.memeCompatibility).toBe(0);
      expect((parsed as any).thought).toBeUndefined();
    });
  });

  describe("DecisionEngine Execution & Idempotency", () => {
    it("evaluates choice and persists decision record", async () => {
      const engine = new DecisionEngine(new MockJevProvider());
      const record = await engine.decideForAsset(testCycleId, "NVDA");

      expect(record.symbol).toBe("NVDA");
      expect(record.decision).toBe("PROMOTE");
      expect(record.confidence).toBe(94);
      expect(record.signals.length).toBeGreaterThan(0);
      expect(record.modelVersion).toBe("jev-2026-08");

      // Verify row exists in database
      const [saved] = await db
        .select()
        .from(jevDecisions)
        .where(
          and(
            eq(jevDecisions.cycleId, testCycleId),
            eq(jevDecisions.symbol, "NVDA"),
          ),
        );

      expect(saved).toBeDefined();
      expect(saved.decision).toBe("PROMOTE");
      expect(saved.confidence).toBe(94);
    });

    it("STOP CONDITION: running decideForAsset twice for same (cycle_id, symbol) leaves EXACTLY ONE row", async () => {
      const engine = new DecisionEngine(new MockJevProvider());

      // Run 1: initial decision
      const run1 = await engine.decideForAsset(testCycleId, "TSLA", { mockRun: 1 });
      expect(run1.decision).toBe("HOLD");

      // Run 2: repeat decision for the exact same cycleId and symbol
      const run2 = await engine.decideForAsset(testCycleId, "TSLA", { mockRun: 2 });
      expect(run2.decision).toBe("HOLD");

      // Query database for all rows matching this cycleId and symbol
      const matchingRows = await db
        .select()
        .from(jevDecisions)
        .where(
          and(
            eq(jevDecisions.cycleId, testCycleId),
            eq(jevDecisions.symbol, "TSLA"),
          ),
        );

      // Must be EXACTLY 1 row, not 2
      expect(matchingRows.length).toBe(1);
      expect(matchingRows[0].symbol).toBe("TSLA");
      expect(matchingRows[0].cycleId).toBe(testCycleId);
    });

    it("evaluates qualitative score dimensions", async () => {
      const engine = createDecisionEngine("mock");
      const scores = await engine.evaluateQualitativeScores("NVDA");

      expect(scores.narrativeMomentum).toBe(98);
      expect(scores.culturalRelevance).toBe(95);
      expect(scores.memeCompatibility).toBe(94);
      expect(scores.cryptoAdjacency).toBe(92);
      expect(scores.pairCompatibility).toBe(96);
    });
  });
});
