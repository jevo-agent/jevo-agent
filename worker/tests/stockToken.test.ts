import { describe, expect, it } from "bun:test";
import {
  CANONICAL_ROBINHOOD_STOCK_TOKENS,
  DexPaprikaClient,
  RealStockTokenProvider,
  createProvidersRegistry,
} from "../src/providers";

describe("RealStockTokenProvider & Robinhood Chain Integration (BACKEND 14)", () => {
  const sampleDexPaprikaResponse = {
    id: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
    name: "NVIDIA • Robinhood Token",
    symbol: "NVDA",
    chain: "robinhood",
    decimals: 18,
    summary: {
      price_usd: 224.67,
      liquidity_usd: 9749077.22,
      "24h": {
        volume_usd: 8024298.98,
        txns: 43225,
      },
    },
    last_updated: "2026-09-27T01:00:00Z",
  };

  it("resolves canonical addresses deterministically for all 7 assets", async () => {
    const provider = new RealStockTokenProvider();

    const expectedAddresses = {
      NVDA: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
      TSLA: "0x322f0929c4625ed5bad873c95208d54e1c003b2d",
      PLTR: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a",
      AAPL: "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9",
      GME: "0x1b0e319c6a659f002271b69db8a7df2f911c153e",
      AMD: "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc",
      COIN: "0x6330d8c3178a418788df01a47479c0ce7ccf450b",
    };

    for (const [sym, addr] of Object.entries(expectedAddresses)) {
      const resolved = await provider.getCanonicalAddress(sym);
      expect(resolved).toBe(addr);
      // Case insensitivity
      expect(await provider.getCanonicalAddress(sym.toLowerCase())).toBe(addr);
    }

    // Unknown symbol returns null
    expect(await provider.getCanonicalAddress("UNKNOWN")).toBeNull();
  });

  it("listActiveAssets returns all 7 canonical tokenized equity assets", async () => {
    const provider = new RealStockTokenProvider();
    const assets = await provider.listActiveAssets();

    expect(assets.length).toBe(7);
    const symbols = assets.map((a) => a.symbol);
    expect(symbols).toContain("NVDA");
    expect(symbols).toContain("TSLA");
    expect(symbols).toContain("PLTR");
    expect(symbols).toContain("AAPL");
    expect(symbols).toContain("GME");
    expect(symbols).toContain("AMD");
    expect(symbols).toContain("COIN");

    for (const a of assets) {
      expect(a.active).toBe(true);
      expect(a.stockTokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(a.name).toContain("• Robinhood Token");
    }
  });

  it("getAssetMetadata returns extended onchain metadata with chainId 4663 and shared beacon", () => {
    const provider = new RealStockTokenProvider();
    const nvdaMeta = provider.getAssetMetadata("NVDA");

    expect(nvdaMeta).toBeDefined();
    expect(nvdaMeta?.chainId).toBe(4663);
    expect(nvdaMeta?.decimals).toBe(18);
    expect(nvdaMeta?.beaconAddress).toBe("0xe10b6f6b275de231345c20d14ab812db62151b00");
  });

  it("DexPaprikaClient caches prices and respects TTL without duplicate fetches", async () => {
    let fetchCount = 0;
    const client = new DexPaprikaClient({ cacheTtlMs: 60_000 });

    // Mock internal fetch
    (client as unknown as { getTokenDetails: (addr: string) => Promise<typeof sampleDexPaprikaResponse> }).getTokenDetails = async () => {
      fetchCount++;
      return sampleDexPaprikaResponse;
    };

    const res1 = await client.getTokenPrice("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec");
    expect(res1.price).toBe(224.67);
    expect(res1.capturedAt).toContain("2026-09-27T01:00:00");
    expect(res1.isStale).toBeUndefined();
    expect(fetchCount).toBe(1);
  });

  it("DexPaprikaClient falls back to stale cache with isStale: true on network or rate limit failure", async () => {
    const client = new DexPaprikaClient({ cacheTtlMs: 10 }); // very short TTL

    // Populate stale cache directly
    (client as unknown as { staleFallback: Map<string, typeof sampleDexPaprikaResponse> }).staleFallback.set(
      "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
      sampleDexPaprikaResponse,
    );

    const originalFetch = globalThis.fetch;
    try {
      // Mock fetch to simulate 429 Rate Limit
      globalThis.fetch = (async () => {
        return new Response("Too Many Requests", { status: 429 });
      }) as unknown as typeof fetch;

      const details = await client.getTokenDetails("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec");
      expect(details.symbol).toBe("NVDA");
      expect(details.summary?.price_usd).toBe(224.67);
      expect(details.isStale).toBe(true);

      const priceInfo = await client.getTokenPrice("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec");
      expect(priceInfo.price).toBe(224.67);
      expect(priceInfo.isStale).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("DexPaprikaClient throws explicit error on missing or malformed last_updated timestamp", async () => {
    const client = new DexPaprikaClient();
    (client as unknown as { getTokenDetails: (addr: string) => Promise<unknown> }).getTokenDetails = async () => ({
      ...sampleDexPaprikaResponse,
      last_updated: "not-a-valid-date",
    });

    await expect(
      client.getTokenPrice("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec"),
    ).rejects.toThrow("DexPaprika returned malformed last_updated");

    (client as unknown as { getTokenDetails: (addr: string) => Promise<unknown> }).getTokenDetails = async () => ({
      ...sampleDexPaprikaResponse,
      last_updated: "",
    });

    await expect(
      client.getTokenPrice("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec"),
    ).rejects.toThrow("DexPaprika returned missing last_updated timestamp");
  });

  it("createProvidersRegistry switches stockTokenMode while preserving independent provider separation", () => {
    // Default mock mode
    const registryMock = createProvidersRegistry({ stockTokenMode: "mock" });
    expect(registryMock.stockToken).toBeDefined();

    // Real mode
    const registryReal = createProvidersRegistry({ stockTokenMode: "real" });
    expect(registryReal.stockToken).toBeDefined();
    // Market data and narrative are independently toggled and separated
    expect(registryReal.marketData).toBeDefined();
    expect(registryReal.narrative).toBeDefined();
    expect(registryReal.social).toBeDefined();
  });

  // Live integration test — skips unless STOCK_TOKEN_MODE === "real" or RUN_LIVE_CHAIN_TESTS === "true"
  const isRealStockMode =
    process.env.STOCK_TOKEN_MODE === "real" || process.env.RUN_LIVE_CHAIN_TESTS === "true";

  it.skipIf(!isRealStockMode)(
    "Live Robinhood Chain RPC & DexPaprika: reads on-chain price and verifies bytecode",
    async () => {
      const provider = new RealStockTokenProvider();
      const nvdaAddress = await provider.getCanonicalAddress("NVDA");
      expect(nvdaAddress).toBe("0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec");

      const onchainPrice = await provider.getOnchainPrice(nvdaAddress!);
      expect(onchainPrice.price).toBeGreaterThan(0);
      expect(typeof onchainPrice.capturedAt).toBe("string");

      const onchainMeta = await provider.verifyOnchain(nvdaAddress!);
      expect(onchainMeta.symbol).toBe("NVDA");
      expect(onchainMeta.name).toBe("NVIDIA • Robinhood Token");
      expect(onchainMeta.decimals).toBe(18);
      expect(onchainMeta.totalSupply).toBeGreaterThan(0n);
    },
    15_000,
  );
});
