import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import { assets, jevDecisions, memeConcepts, rankHistory } from "../src/db/schema";
import { seedAssets } from "../src/db/seed";

describe("Database Schema & Uniqueness Constraints (BACKEND 01)", () => {
  beforeAll(async () => {
    // Ensure 7 assets are seeded
    await seedAssets();
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(jevDecisions).where(eq(jevDecisions.cycleId, "test-cycle-constraint"));
    await db.delete(rankHistory).where(eq(rankHistory.cycleId, "test-cycle-constraint"));
    await db.delete(memeConcepts).where(eq(memeConcepts.id, "concept-gpu-test"));
  });

  it("has the 7 required stock assets seeded properly", async () => {
    const rows = await db.select().from(assets);
    const symbols = rows.map((r) => r.symbol);

    expect(rows.length).toBeGreaterThanOrEqual(7);
    expect(symbols).toContain("NVDA");
    expect(symbols).toContain("TSLA");
    expect(symbols).toContain("PLTR");
    expect(symbols).toContain("AAPL");
    expect(symbols).toContain("GME");
    expect(symbols).toContain("AMD");
    expect(symbols).toContain("COIN");
  });

  it("CRITICAL: rejects duplicate (cycle_id, symbol) insert on rank_history", async () => {
    const cycleId = "test-cycle-constraint";
    const symbol = "NVDA";

    // Clean any leftover row from previous runs
    await db
      .delete(rankHistory)
      .where(and(eq(rankHistory.cycleId, cycleId), eq(rankHistory.symbol, symbol)));

    // First insert must succeed
    await db.insert(rankHistory).values({
      cycleId,
      symbol,
      currentRank: 1,
      previousRank: 2,
      opportunityScore: 95.5,
    });

    // Second insert with the exact same (cycle_id, symbol) MUST fail with constraint error
    let thrownError: any = null;
    try {
      await db.insert(rankHistory).values({
        cycleId,
        symbol,
        currentRank: 2,
        previousRank: 1,
        opportunityScore: 92.0,
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).not.toBeNull();
    const cause = thrownError?.cause ?? thrownError;
    const errorString = `${thrownError?.message ?? ""} ${cause?.message ?? ""} ${cause?.constraint ?? ""}`;

    // Postgres 23505 = unique_violation, constraint = rank_history_cycle_id_symbol_pk
    expect(
      cause?.code === "23505" ||
      errorString.includes("rank_history_cycle_id_symbol_pk") ||
      errorString.includes("duplicate key"),
    ).toBe(true);
  });

  it("CRITICAL: rejects duplicate (cycle_id, symbol) insert on jev_decisions", async () => {
    const cycleId = "test-cycle-constraint";
    const symbol = "NVDA";

    // Clean any leftover row
    await db
      .delete(jevDecisions)
      .where(and(eq(jevDecisions.cycleId, cycleId), eq(jevDecisions.symbol, symbol)));

    // First insert must succeed
    await db.insert(jevDecisions).values({
      id: "jd-test-01",
      cycleId,
      symbol,
      decision: "PROMOTE",
      confidence: 95,
      signals: ["AI infrastructure accelerating"],
      modelVersion: "jev-2026-08",
    });

    // Second insert with different id but same (cycle_id, symbol) MUST fail
    let thrownError: any = null;
    try {
      await db.insert(jevDecisions).values({
        id: "jd-test-02",
        cycleId,
        symbol,
        decision: "HOLD",
        confidence: 80,
        signals: ["Holding state"],
        modelVersion: "jev-2026-08",
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).not.toBeNull();
    const cause = thrownError?.cause ?? thrownError;
    const errorString = `${thrownError?.message ?? ""} ${cause?.message ?? ""} ${cause?.constraint ?? ""}`;

    // Postgres 23505 = unique_violation, constraint = uq_jev_decisions_cycle_symbol
    expect(
      cause?.code === "23505" ||
      errorString.includes("uq_jev_decisions_cycle_symbol") ||
      errorString.includes("duplicate key"),
    ).toBe(true);
  });

  it("allows idempotent upsert on rank_history using onConflictDoUpdate", async () => {
    const cycleId = "test-cycle-constraint";
    const symbol = "TSLA";

    // Clean any leftover
    await db
      .delete(rankHistory)
      .where(and(eq(rankHistory.cycleId, cycleId), eq(rankHistory.symbol, symbol)));

    // Insert initial
    await db
      .insert(rankHistory)
      .values({
        cycleId,
        symbol,
        currentRank: 3,
        previousRank: 4,
        opportunityScore: 90.0,
      })
      .onConflictDoUpdate({
        target: [rankHistory.cycleId, rankHistory.symbol],
        set: { currentRank: 2, opportunityScore: 93.0 },
      });

    // Update via conflict
    await db
      .insert(rankHistory)
      .values({
        cycleId,
        symbol,
        currentRank: 3,
        previousRank: 4,
        opportunityScore: 90.0,
      })
      .onConflictDoUpdate({
        target: [rankHistory.cycleId, rankHistory.symbol],
        set: { currentRank: 2, opportunityScore: 93.0 },
      });

    const [row] = await db
      .select()
      .from(rankHistory)
      .where(and(eq(rankHistory.cycleId, cycleId), eq(rankHistory.symbol, symbol)));

    expect(row).toBeDefined();
    expect(row.currentRank).toBe(2);
    expect(row.opportunityScore).toBe(93.0);
  });

  it("stores meme concepts with jsonb tags and notes", async () => {
    const conceptId = "concept-gpu-test";
    await db.delete(memeConcepts).where(eq(memeConcepts.id, conceptId));

    await db.insert(memeConcepts).values({
      id: conceptId,
      name: "$GPU",
      tags: ["compute", "ai", "hardware"],
      notes: "Team curated meme primitive for compute infrastructure",
    });

    const [concept] = await db
      .select()
      .from(memeConcepts)
      .where(eq(memeConcepts.id, conceptId));

    expect(concept).toBeDefined();
    expect(concept.name).toBe("$GPU");
    expect(concept.tags).toEqual(["compute", "ai", "hardware"]);
    expect(concept.notes).toContain("compute infrastructure");
  });
});
