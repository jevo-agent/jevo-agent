import { executeAgentCycle } from "../src/agent/cycle";
import { createProvidersRegistry } from "../src/providers";
import { db } from "../src/db/client";
import { marketSnapshots, signalObservations } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  console.log("=== Triggering Manual Real Cycle with Alpha Vantage ===");

  const providersRegistry = createProvidersRegistry({
    marketDataMode: "real",
    narrativeMode: "real",
  });

  const forcedCycleId = `cycle-real-av-${Date.now()}`;
  console.log(`Cycle ID: ${forcedCycleId}`);

  const result = await executeAgentCycle("DELTA", {
    forcedCycleId,
    providersRegistry,
  });

  console.log("\nCycle Execution Result:");
  console.log(JSON.stringify(result, null, 2));

  // Query database to verify real data persistence
  const realSnapshots = await db
    .select()
    .from(marketSnapshots)
    .where(eq(marketSnapshots.symbol, "NVDA"))
    .orderBy(desc(marketSnapshots.capturedAt))
    .limit(1);

  console.log("\nPersisted NVDA Market Snapshot in DB:");
  console.log(JSON.stringify(realSnapshots[0], null, 2));

  const realSignals = await db
    .select()
    .from(signalObservations)
    .where(eq(signalObservations.symbol, "NVDA"))
    .orderBy(desc(signalObservations.capturedAt))
    .limit(2);

  console.log("\nPersisted NVDA Signal Observations in DB (sample):");
  console.log(JSON.stringify(realSignals, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Manual cycle execution failed:", err);
  process.exit(1);
});
