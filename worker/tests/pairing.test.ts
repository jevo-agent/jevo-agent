import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  memeConcepts,
  pairingCandidates,
  pairingDecisions,
  pairingHistory,
  protocolEvents,
} from "../src/db/schema";
import { MockJevProvider } from "../src/jev";
import {
  computePairingScore,
  evaluatePairing,
  DEFAULT_PAIRING_WEIGHTS,
} from "../src/pairing";

describe("Pairing Engine & Meme Concept Lookup (BACKEND 06)", () => {
  const jev = new MockJevProvider();

  // Test data IDs
  const dummyConceptIds = ["mc-test-gpu", "mc-test-neo", "mc-test-doge"];
  const testSymbol = "NVDA";

  beforeAll(async () => {
    // Clean up test data before starting
    await db.delete(pairingHistory);
    await db.delete(pairingDecisions);
    await db.delete(pairingCandidates);
    await db.delete(memeConcepts);
  });

  afterAll(async () => {
    // Clean up test data after tests and restore curated concepts
    await db.delete(pairingHistory);
    await db.delete(pairingDecisions);
    await db.delete(pairingCandidates);
    await db.delete(memeConcepts);
    const { seedMemeConcepts } = await import("../src/db/seed");
    await seedMemeConcepts();
  });

  describe("1. Empty meme_concepts handling", () => {
    it("returns an empty array cleanly without error when meme_concepts table is empty", async () => {
      // Ensure table is empty
      const existing = await db.select().from(memeConcepts);
      expect(existing.length).toBe(0);

      const results = await evaluatePairing({
        stockSymbol: testSymbol,
        narrativeSignals: ["AI chip acceleration", "Datacenter revenue surge"],
        jev,
      });

      expect(results).toBeArray();
      expect(results.length).toBe(0);
    });
  });

  describe("2. Tag-Overlap Lookup & Candidate Evaluation", () => {
    beforeAll(async () => {
      // Seed 3 dummy meme concepts:
      // 1. $GPU: tags overlapping NVDA, chips, gpu, ai
      // 2. $NEO: tags overlapping ai, matrix, intelligence
      // 3. $DOGE: tags meme, dog, elon (0 overlap with NVDA)
      await db.insert(memeConcepts).values([
        {
          id: "mc-test-gpu",
          name: "$GPU",
          tags: ["nvda", "chips", "hardware", "gpu", "ai"],
          notes: "Curated GPU narrative token",
          createdAt: new Date(),
        },
        {
          id: "mc-test-neo",
          name: "$NEO",
          tags: ["ai", "matrix", "agent", "intelligence"],
          notes: "Curated AI intelligence agent token",
          createdAt: new Date(),
        },
        {
          id: "mc-test-doge",
          name: "$DOGE",
          tags: ["dog", "meme", "elon", "moon"],
          notes: "Curated canine meme token",
          createdAt: new Date(),
        },
      ]);
    });

    it("retrieves candidates by tag-overlap and evaluates theses with Jev components", async () => {
      const narrativeSignals = [
        "AI chip demand surges across datacenters",
        "Record GPU supply allocations",
      ];

      const candidates = await evaluatePairing({
        stockSymbol: testSymbol,
        narrativeSignals,
        jev,
      });

      // $GPU has highest tag overlap (nvda, gpu, ai, chip), $NEO has overlap on "ai", $DOGE has 0 overlap
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      // Verify no concept outside meme_concepts is invented
      const candidateNames = candidates.map((c) => c.memeSymbol);
      expect(candidateNames).toContain("$GPU");
      expect(candidateNames).not.toContain("$DOGE"); // 0 overlap should not match

      // Assert primary candidate has valid 4-field thesis per Section 10
      const primary = candidates[0];
      expect(primary.symbol).toBe("NVDA");
      expect(primary.thesis).toBeDefined();
      expect(primary.thesis.whyStock).toBeString();
      expect(primary.thesis.whyStock.length).toBeGreaterThan(10);
      expect(primary.thesis.whyMeme).toBeString();
      expect(primary.thesis.whyMeme.length).toBeGreaterThan(10);
      expect(primary.thesis.whyPair).toBeString();
      expect(primary.thesis.whyPair.length).toBeGreaterThan(10);
      expect(primary.thesis.whyNow).toBeString();
      expect(primary.thesis.whyNow.length).toBeGreaterThan(10);

      // Assert 6 qualitative component scores from Jev
      expect(primary.components.narrative).toBeGreaterThanOrEqual(0);
      expect(primary.components.cultural).toBeGreaterThanOrEqual(0);
      expect(primary.components.meme).toBeGreaterThanOrEqual(0);
      expect(primary.components.crypto).toBeGreaterThanOrEqual(0);
      expect(primary.components.timing).toBeGreaterThanOrEqual(0);
      expect(primary.components.stockRelevance).toBeGreaterThanOrEqual(0);

      // Assert pairingScore is calculated deterministically
      const expectedScore = computePairingScore(primary.components);
      expect(primary.pairingScore).toBe(expectedScore);
    });

    it("persists all candidates with lifecycle_state = 'PROPOSED' and records history transition", async () => {
      const candidates = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.symbol, "NVDA"));

      expect(candidates.length).toBeGreaterThan(0);

      for (const candidate of candidates) {
        // Strict assertion: NEVER auto-publish past PROPOSED
        expect(candidate.lifecycleState).toBe("PROPOSED");

        // Verify pairing_decisions record exists
        const decisions = await db
          .select()
          .from(pairingDecisions)
          .where(eq(pairingDecisions.pairingCandidateId, candidate.id));
        expect(decisions.length).toBeGreaterThanOrEqual(1);
        expect(decisions[0].decision).toBeDefined();
        expect(decisions[0].confidence).toBeGreaterThan(0);

        // Verify pairing_history records initial PROPOSED transition
        const history = await db
          .select()
          .from(pairingHistory)
          .where(eq(pairingHistory.pairingCandidateId, candidate.id));
        expect(history.length).toBeGreaterThanOrEqual(1);
        expect(history[0].fromState).toBe("PROPOSED");
        expect(history[0].toState).toBe("PROPOSED");
        expect(history[0].actor).toBe("JEVO_AGENT");

        // Verify Section 12 PAIRING_PROPOSED event published
        const events = await db
          .select()
          .from(protocolEvents)
          .where(eq(protocolEvents.subjectId, candidate.id));
        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events[0].eventType).toBe("PAIRING_PROPOSED");
      }
    });
  });

  describe("3. Determinism & Arithmetic Consistency (Section 10)", () => {
    it("computePairingScore produces byte-identical results across 100 repeated runs", () => {
      const fixedComponents = {
        narrative: 92,
        cultural: 85,
        meme: 90,
        crypto: 78,
        timing: 88,
        stockRelevance: 95,
      };

      const baseline = computePairingScore(fixedComponents, DEFAULT_PAIRING_WEIGHTS);

      for (let i = 0; i < 100; i++) {
        const next = computePairingScore(fixedComponents, DEFAULT_PAIRING_WEIGHTS);
        expect(next).toBe(baseline);
      }

      // Expected manual calculation:
      // 92*0.2 + 85*0.15 + 90*0.2 + 78*0.15 + 88*0.15 + 95*0.15
      // = 18.4 + 12.75 + 18.0 + 11.7 + 13.2 + 14.25 = 88.3
      expect(baseline).toBe(88.3);
    });

    it("clamps pairing scores to the [0, 100] range", () => {
      const overflown = {
        narrative: 150,
        cultural: 150,
        meme: 150,
        crypto: 150,
        timing: 150,
        stockRelevance: 150,
      };
      expect(computePairingScore(overflown)).toBe(100);

      const underflown = {
        narrative: -50,
        cultural: -50,
        meme: -50,
        crypto: -50,
        timing: -50,
        stockRelevance: -50,
      };
      expect(computePairingScore(underflown)).toBe(0);
    });
  });

  describe("4. Multi-Cycle Pairing Idempotency & Operator Curation Preservation (STEP 3)", () => {
    it("(a) running pairing 2x cycle keeps exactly 1 row per pair and does not insert duplicate history", async () => {
      // Clear test pairings first
      await db.delete(pairingHistory);
      await db.delete(pairingDecisions);
      await db.delete(pairingCandidates);

      const narrativeSignals = [
        "AI chip demand surges across datacenters",
        "Record GPU supply allocations",
      ];

      // Cycle 1
      const cycle1Candidates = await evaluatePairing({
        stockSymbol: testSymbol,
        narrativeSignals,
        jev,
      });
      expect(cycle1Candidates.length).toBeGreaterThan(0);

      const rowsCycle1 = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.symbol, testSymbol));
      const historyCycle1 = await db
        .select()
        .from(pairingHistory);

      expect(rowsCycle1.length).toBe(cycle1Candidates.length);
      expect(historyCycle1.length).toBe(cycle1Candidates.length);

      // Cycle 2 with identical signals
      const cycle2Candidates = await evaluatePairing({
        stockSymbol: testSymbol,
        narrativeSignals,
        jev,
      });

      const rowsCycle2 = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.symbol, testSymbol));
      const historyCycle2 = await db
        .select()
        .from(pairingHistory);

      // (a) Still exactly 1 row per pair! No duplicate candidates!
      expect(rowsCycle2.length).toBe(rowsCycle1.length);
      // No PROPOSED->PROPOSED history written on cycle 2!
      expect(historyCycle2.length).toBe(historyCycle1.length);
    });

    it("(b) CURATED candidate is not overwritten by subsequent cycles and no duplicate is created", async () => {
      // Find one candidate to curate
      const [candidateToCurate] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.symbol, testSymbol))
        .limit(1);

      expect(candidateToCurate).toBeDefined();

      const operatorThesis = {
        whyStock: "Operator verified thesis for NVDA.",
        whyMeme: "Operator curated token.",
        whyPair: "Operator alignment.",
        whyNow: "Operator catalyst timing.",
      };
      const operatorScore = 99.5;

      // Operator curates candidate
      await db
        .update(pairingCandidates)
        .set({
          lifecycleState: "CURATED",
          thesis: operatorThesis,
          pairingScore: operatorScore,
        })
        .where(eq(pairingCandidates.id, candidateToCurate.id));

      // Run pairing cycle again
      const narrativeSignals = [
        "AI chip demand surges across datacenters",
        "Record GPU supply allocations",
      ];

      await evaluatePairing({
        stockSymbol: testSymbol,
        narrativeSignals,
        jev,
      });

      // Verify operator curation was preserved:
      const [curatedAfter] = await db
        .select()
        .from(pairingCandidates)
        .where(eq(pairingCandidates.id, candidateToCurate.id));

      expect(curatedAfter.lifecycleState).toBe("CURATED");
      expect(curatedAfter.pairingScore).toBe(operatorScore);
      expect(curatedAfter.thesis.whyStock).toBe("Operator verified thesis for NVDA.");

      // Verify no duplicate PROPOSED candidate was created for this symbol & memeSymbol
      const allMatching = await db
        .select()
        .from(pairingCandidates)
        .where(
          and(
            eq(pairingCandidates.symbol, testSymbol),
            eq(pairingCandidates.memeSymbol, candidateToCurate.memeSymbol),
          ),
        );

      expect(allMatching.length).toBe(1);
      expect(allMatching[0].lifecycleState).toBe("CURATED");
    });
  });
});
