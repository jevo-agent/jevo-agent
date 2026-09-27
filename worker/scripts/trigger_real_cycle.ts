import { executeAgentCycle } from "../src/agent/cycle";
import { createProvidersRegistry } from "../src/providers";
import { createDecisionEngine } from "../src/jev";
import { db } from "../src/db/client";
import { marketSnapshots, signalObservations, jevDecisions, opportunityScores, rankHistory, agentCycles } from "../src/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

// Safety check: this script is strictly an isolated developer CLI tool for on-demand capstone verification.
// It is intentionally not exported or imported by any worker runtime module.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_MANUAL_TRIGGER !== "true") {
  console.error("ERROR: Manual cycle trigger is strictly disabled in production unless ALLOW_MANUAL_TRIGGER=true");
  process.exit(1);
}

async function main() {
  const shouldCleanup = process.argv.includes("--cleanup");

  console.log("==================================================================");
  console.log("=== CAPSTONE TEST: TRIGGERING CYCLE WITH ALL REAL PROVIDERS ===");
  console.log("==================================================================");
  console.log("- JEV_MODE: real (Vercel AI Gateway typesafe-ai/jev)");
  console.log("- MARKET_DATA_MODE: real (Alpha Vantage GLOBAL_QUOTE)");
  console.log("- NARRATIVE_MODE: real (Alpha Vantage NEWS_SENTIMENT)");
  console.log("- STOCK_TOKEN_MODE: real (Robinhood Chain RPC + DexPaprika)");
  console.log("- SOCIAL_MODE: mock (Intentionally preserved as mock)");
  console.log(`- CLEANUP_AFTER_RUN: ${shouldCleanup ? "yes" : "no"}`);
  console.log("==================================================================\n");

  const providersRegistry = createProvidersRegistry({
    marketDataMode: "real",
    narrativeMode: "real",
    stockTokenMode: "real",
  });

  const decisionEngine = createDecisionEngine("real");

  const forcedCycleId = `cycle-capstone-real-${Date.now()}`;
  console.log(`Starting Cycle ID: ${forcedCycleId}\n`);

  const t0 = Date.now();
  const result = await executeAgentCycle("DELTA", {
    forcedCycleId,
    providersRegistry,
    decisionEngine,
  });
  const elapsed = Date.now() - t0;

  console.log("\n==================================================================");
  console.log("=== CAPSTONE CYCLE EXECUTION SUMMARY ===");
  console.log("==================================================================");
  console.log(`Status: ${result.status}`);
  console.log(`Duration: ${result.durationMs}ms (wall-clock: ${elapsed}ms)`);
  console.log(`Assets Scanned: ${result.assetsScanned}`);
  console.log(`Signals Processed: ${result.signalsProcessed}`);
  console.log(`Ranked Assets Count: ${result.rankingSummary?.rankedAssets?.length ?? 0}`);
  if (result.rankingSummary?.rankedAssets && result.rankingSummary.rankedAssets.length > 0) {
    console.log("\nTop 3 Ranked Assets:");
    result.rankingSummary.rankedAssets.slice(0, 3).forEach((a, idx) => {
      console.log(`  #${idx + 1} ${a.symbol} - Score: ${a.opportunityScore} (Rank: ${a.currentRank})`);
    });
  }

  // Database verification: Market Snapshot
  const realSnapshots = await db
    .select()
    .from(marketSnapshots)
    .where(eq(marketSnapshots.symbol, "NVDA"))
    .orderBy(desc(marketSnapshots.capturedAt))
    .limit(1);

  console.log("\n=== Persisted NVDA Real Market Snapshot (Alpha Vantage) ===");
  console.log(JSON.stringify(realSnapshots[0], null, 2));

  // Database verification: Real Narrative Signals
  const realSignals = await db
    .select()
    .from(signalObservations)
    .where(eq(signalObservations.symbol, "NVDA"))
    .orderBy(desc(signalObservations.capturedAt))
    .limit(3);

  console.log("\n=== Persisted NVDA Real Signals (Sample) ===");
  console.log(JSON.stringify(realSignals, null, 2));

  // Database verification: Real Jev Decision
  const realJev = await db
    .select()
    .from(jevDecisions)
    .where(eq(jevDecisions.cycleId, forcedCycleId))
    .limit(3);

  console.log("\n=== Persisted Jev Decisions (Real AI Gateway Sample) ===");
  console.log(JSON.stringify(realJev, null, 2));

  // Database verification: Opportunity Scores
  const realScores = await db
    .select()
    .from(opportunityScores)
    .where(eq(opportunityScores.cycleId, forcedCycleId))
    .limit(3);

  console.log("\n=== Persisted Opportunity Scores (Sample) ===");
  console.log(JSON.stringify(realScores, null, 2));

  if (shouldCleanup) {
    console.log("\nCleaning up test cycle database records...");
    await db.delete(opportunityScores).where(eq(opportunityScores.cycleId, forcedCycleId));
    await db.delete(jevDecisions).where(eq(jevDecisions.cycleId, forcedCycleId));
    await db.delete(rankHistory).where(eq(rankHistory.cycleId, forcedCycleId));
    await db.delete(agentCycles).where(eq(agentCycles.id, forcedCycleId));
    console.log("Cleanup complete. No stale test rows left in database.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Capstone cycle execution failed:", err);
  process.exit(1);
});
