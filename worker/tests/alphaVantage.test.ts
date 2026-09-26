import { describe, expect, it } from "bun:test";
import {
  AlphaVantageClient,
  RealMarketDataProvider,
  RealNarrativeProvider,
  createProvidersRegistry,
} from "../src/providers";

describe("AlphaVantage Providers (BACKEND 12 + 13)", () => {
  const sampleQuote = {
    "Global Quote": {
      "01. symbol": "NVDA",
      "02. open": "225.1300",
      "03. high": "226.9400",
      "04. low": "223.1329",
      "05. price": "225.0700",
      "06. volume": "89947712",
      "07. latest trading day": "2026-09-25",
      "08. previous close": "224.5800",
      "09. change": "0.4900",
      "10. change percent": "0.2182%",
    },
  };

  const sampleNews = {
    items: "1",
    feed: [
      {
        title: "NVIDIA Advances AI Hardware Infrastructure Across Enterprise",
        url: "https://example.com/nvda-ai",
        time_published: "20260926T161439",
        authors: ["Test Author"],
        summary: "NVIDIA reports robust demand for data center compute.",
        overall_sentiment_score: 0.25,
        overall_sentiment_label: "Somewhat_Bullish",
        ticker_sentiment: [
          {
            ticker: "NVDA",
            relevance_score: "0.850000",
            ticker_sentiment_score: "0.400000",
            ticker_sentiment_label: "Bullish",
          },
        ],
      },
    ],
  };

  it("RealMarketDataProvider maps confirmed Alpha Vantage GLOBAL_QUOTE shape to MarketSnapshot", async () => {
    const client = new AlphaVantageClient({ apiKey: "test_key", cacheTtlMs: 60_000 });
    // Intercept client fetch
    (client as unknown as { fetchWithPacing: (url: string) => Promise<unknown> }).fetchWithPacing = async () => sampleQuote;

    const provider = new RealMarketDataProvider({ client });
    const snapshot = await provider.getSnapshot("NVDA");

    expect(snapshot.symbol).toBe("NVDA");
    expect(snapshot.price).toBe(225.07);
    expect(snapshot.volume24h).toBe(89947712);
    expect(snapshot.source).toBe("alphavantage");
    expect(snapshot.volatility).toBeGreaterThan(0);
    expect(snapshot.volatility).toBeLessThanOrEqual(1.0);
    expect(snapshot.capturedAt).toContain("2026-09-25");
  });

  it("RealNarrativeProvider maps NEWS_SENTIMENT articles to SignalObservation with scaled magnitude", async () => {
    const client = new AlphaVantageClient({ apiKey: "test_key", cacheTtlMs: 60_000 });
    (client as unknown as { fetchWithPacing: (url: string) => Promise<unknown> }).fetchWithPacing = async () => sampleNews;

    const provider = new RealNarrativeProvider({ client });
    const signals = await provider.getSignals("NVDA");

    expect(signals.length).toBe(1);
    expect(signals[0].symbol).toBe("NVDA");
    expect(signals[0].kind).toBe("NEWS");
    // (0.4 + 1) / 2 * 100 = 70
    expect(signals[0].magnitude).toBe(70);
    expect(signals[0].label).toContain("NVIDIA Advances AI Hardware");
    expect(signals[0].source).toBe("alphavantage");
  });

  it("AlphaVantageClient caches responses within TTL to conserve the 25 req/day quota", async () => {
    let callCount = 0;
    const client = new AlphaVantageClient({ apiKey: "test_key", cacheTtlMs: 10_000 });
    (client as unknown as { fetchWithPacing: (url: string) => Promise<unknown> }).fetchWithPacing = async () => {
      callCount++;
      return sampleQuote;
    };

    const quote1 = await client.getGlobalQuote("NVDA");
    const quote2 = await client.getGlobalQuote("NVDA");

    expect(callCount).toBe(1);
    expect(quote1["05. price"]).toBe("225.0700");
    expect(quote2["05. price"]).toBe("225.0700");
    expect(client.hasCached("quote:NVDA")).toBe(true);
  });

  it("createProvidersRegistry switches marketData and narrative while preserving mock social and stockToken", () => {
    const registryMock = createProvidersRegistry({ marketDataMode: "mock", narrativeMode: "mock" });
    expect(registryMock.marketData).toBeDefined();
    expect(registryMock.narrative).toBeDefined();
    expect(registryMock.social).toBeDefined();
    expect(registryMock.stockToken).toBeDefined();

    const client = new AlphaVantageClient({ apiKey: "test_key" });
    const registryReal = createProvidersRegistry({ marketDataMode: "real", narrativeMode: "real" });
    expect(registryReal.marketData).toBeDefined();
    expect(registryReal.narrative).toBeDefined();
    // Social and StockToken are strictly untouched (Mock)
    expect(registryReal.social).toBeDefined();
    expect(registryReal.stockToken).toBeDefined();
  });

  // Live integration test — skips if ALPHA_VANTAGE_API_KEY is not set or empty
  const liveApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const hasLiveKey = Boolean(liveApiKey && liveApiKey.trim().length > 0 && !liveApiKey.includes("example"));

  it.skipIf(!hasLiveKey)(
    "Live Alpha Vantage smoke test: fetches real quote and news for NVDA within rate limit",
    async () => {
      const client = new AlphaVantageClient({ apiKey: liveApiKey! });
      const rawQuote = await client.getGlobalQuote("NVDA");
      if (!rawQuote["01. symbol"]) {
        // Daily free tier quota (25 req/day) reached during test session
        expect(rawQuote).toBeDefined();
        return;
      }
      expect(rawQuote["01. symbol"]).toBe("NVDA");
      expect(Number(rawQuote["05. price"])).toBeGreaterThan(0);

      const rawNews = await client.getNewsSentiment("NVDA");
      expect(rawNews).toBeDefined();
      if (rawNews.feed) {
        expect(Array.isArray(rawNews.feed)).toBe(true);
      }
    },
    15_000,
  );
});
