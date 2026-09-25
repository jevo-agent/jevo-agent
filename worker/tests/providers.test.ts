import { afterAll, describe, expect, it } from "bun:test";
import { desc, eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import { providerRuns } from "../src/db/schema";
import {
  createProvidersRegistry,
  MockMarketDataProvider,
  MockNarrativeProvider,
  MockSocialProvider,
  MockStockTokenProvider,
  withProviderHealth,
  wrapProviderWithHealthLogging,
} from "../src/providers";

describe("Provider Contracts & Mocks (BACKEND 02)", () => {
  afterAll(async () => {
    // Clean up test provider runs
    await db.delete(providerRuns).where(eq(providerRuns.provider, "test-failing-provider"));
  });

  describe("Mock Providers Contract Compliance", () => {
    it("MockMarketDataProvider returns valid snapshot shapes", async () => {
      const provider = new MockMarketDataProvider();
      const snapshot = await provider.getSnapshot("NVDA");

      expect(snapshot.symbol).toBe("NVDA");
      expect(snapshot.price).toBeGreaterThan(0);
      expect(snapshot.volume24h).toBeGreaterThan(0);
      expect(snapshot.volatility).toBeGreaterThan(0);
      expect(typeof snapshot.capturedAt).toBe("string");
      expect(snapshot.source).toBe("mock-polygon");

      const batch = await provider.getSnapshots(["NVDA", "TSLA"]);
      expect(batch.length).toBe(2);
      expect(batch[0].symbol).toBe("NVDA");
      expect(batch[1].symbol).toBe("TSLA");
    });

    it("MockStockTokenProvider returns canonical address and active assets", async () => {
      const provider = new MockStockTokenProvider();
      const address = await provider.getCanonicalAddress("NVDA");

      expect(address).toBe("0x1000000000000000000000000000000000000001");

      const onchainPrice = await provider.getOnchainPrice(address!);
      expect(onchainPrice.price).toBeGreaterThan(0);
      expect(typeof onchainPrice.capturedAt).toBe("string");

      const assetsList = await provider.listActiveAssets();
      expect(assetsList.length).toBe(7);
      const symbols = assetsList.map((a) => a.symbol);
      expect(symbols).toContain("NVDA");
      expect(symbols).toContain("COIN");
    });

    it("MockNarrativeProvider returns narrative and news signals", async () => {
      const provider = new MockNarrativeProvider();
      const signals = await provider.getSignals("NVDA");

      expect(signals.length).toBeGreaterThan(0);
      for (const sig of signals) {
        expect(sig.symbol).toBe("NVDA");
        expect(["NARRATIVE", "NEWS"]).toContain(sig.kind);
        expect(sig.magnitude).toBeGreaterThanOrEqual(0);
        expect(sig.magnitude).toBeLessThanOrEqual(100);
        expect(sig.label.length).toBeGreaterThan(0);
      }
    });

    it("MockSocialProvider returns social velocity signals", async () => {
      const provider = new MockSocialProvider();
      const signals = await provider.getVelocity("NVDA");

      expect(signals.length).toBeGreaterThan(0);
      for (const sig of signals) {
        expect(sig.symbol).toBe("NVDA");
        expect(sig.kind).toBe("SOCIAL");
        expect(sig.magnitude).toBeGreaterThanOrEqual(0);
        expect(sig.magnitude).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Provider Health Wrapper & Persistence", () => {
    it("writes a HEALTHY provider_runs record on successful call", async () => {
      const providerName = "mock-market-test";
      const wrapped = wrapProviderWithHealthLogging(
        providerName,
        new MockMarketDataProvider(),
      );

      const result = await wrapped.getSnapshot("PLTR");
      expect(result.symbol).toBe("PLTR");

      // Verify row exists in provider_runs
      const runs = await db
        .select()
        .from(providerRuns)
        .where(eq(providerRuns.provider, providerName))
        .orderBy(desc(providerRuns.ranAt))
        .limit(1);

      expect(runs.length).toBe(1);
      expect(runs[0].provider).toBe(providerName);
      expect(runs[0].status).toBe("HEALTHY");
      expect(runs[0].error).toBeNull();
      expect(runs[0].latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("writes a DOWN provider_runs record on failed call and rethrows error", async () => {
      const providerName = "test-failing-provider";

      const failingProvider = {
        async fetchBadData() {
          throw new Error("Simulated upstream vendor 503 error");
        },
      };

      const wrapped = wrapProviderWithHealthLogging(providerName, failingProvider);

      let caughtError: Error | null = null;
      try {
        await wrapped.fetchBadData();
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toBe("Simulated upstream vendor 503 error");

      // Verify row exists with status DOWN
      const runs = await db
        .select()
        .from(providerRuns)
        .where(eq(providerRuns.provider, providerName))
        .orderBy(desc(providerRuns.ranAt))
        .limit(1);

      expect(runs.length).toBe(1);
      expect(runs[0].status).toBe("DOWN");
      expect(runs[0].error).toContain("Simulated upstream vendor 503 error");
    });

    it("registry factory provides wrapped instances that write to provider_runs", async () => {
      const registry = createProvidersRegistry("mock");

      await registry.marketData.getSnapshot("AAPL");
      await registry.narrative.getSignals("AAPL");
      await registry.social.getVelocity("AAPL");
      await registry.stockToken.listActiveAssets();

      const runs = await db
        .select()
        .from(providerRuns)
        .orderBy(desc(providerRuns.ranAt))
        .limit(4);

      const providersCalled = runs.map((r) => r.provider);
      expect(providersCalled).toContain("mock-market-data");
      expect(providersCalled).toContain("mock-narrative");
      expect(providersCalled).toContain("mock-social");
      expect(providersCalled).toContain("mock-stock-token");
    });
  });
});
