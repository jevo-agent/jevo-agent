import { env } from "../config/env";
import { RealMarketDataProvider } from "./alphavantage/RealMarketDataProvider";
import { RealNarrativeProvider } from "./alphavantage/RealNarrativeProvider";
import { AlphaVantageClient } from "./alphavantage/client";
import { MockMarketDataProvider } from "./mock/MockMarketDataProvider";
import { MockNarrativeProvider } from "./mock/MockNarrativeProvider";
import { MockSocialProvider } from "./mock/MockSocialProvider";
import { MockStockTokenProvider } from "./mock/MockStockTokenProvider";
import type { ProvidersRegistry } from "./types";
import { wrapProviderWithHealthLogging } from "./wrapper";

export * from "./types";
export * from "./wrapper";
export * from "./mock/MockMarketDataProvider";
export * from "./mock/MockNarrativeProvider";
export * from "./mock/MockSocialProvider";
export * from "./mock/MockStockTokenProvider";
export * from "./alphavantage/RealMarketDataProvider";
export * from "./alphavantage/RealNarrativeProvider";
export * from "./alphavantage/client";

export interface CreateProvidersRegistryOptions {
  marketDataMode?: "mock" | "real";
  narrativeMode?: "mock" | "real";
}

export function createProvidersRegistry(
  optionsOrMode?: "mock" | "real" | CreateProvidersRegistryOptions,
): ProvidersRegistry {
  let marketMode: "mock" | "real";
  let narrativeMode: "mock" | "real";

  if (typeof optionsOrMode === "string") {
    // Backward compatibility with legacy PROVIDER_MODE toggle
    marketMode = optionsOrMode === "real" ? "real" : env.MARKET_DATA_MODE;
    narrativeMode = optionsOrMode === "real" ? "real" : env.NARRATIVE_MODE;
  } else {
    marketMode = optionsOrMode?.marketDataMode ?? env.MARKET_DATA_MODE;
    narrativeMode = optionsOrMode?.narrativeMode ?? env.NARRATIVE_MODE;
  }

  let sharedClient: AlphaVantageClient | undefined;
  if (marketMode === "real" || narrativeMode === "real") {
    const apiKey = env.ALPHA_VANTAGE_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      sharedClient = new AlphaVantageClient({
        apiKey,
        cacheTtlMs: env.ALPHA_VANTAGE_CACHE_TTL_MS,
        maxDailyRequests: env.ALPHA_VANTAGE_MAX_DAILY_REQUESTS,
      });
    }
  }

  const marketData =
    marketMode === "real"
      ? wrapProviderWithHealthLogging(
          "real-market-data-alphavantage",
          new RealMarketDataProvider({ client: sharedClient }),
        )
      : wrapProviderWithHealthLogging(
          "mock-market-data",
          new MockMarketDataProvider(),
        );

  const narrative =
    narrativeMode === "real"
      ? wrapProviderWithHealthLogging(
          "real-narrative-alphavantage",
          new RealNarrativeProvider({ client: sharedClient }),
        )
      : wrapProviderWithHealthLogging(
          "mock-narrative",
          new MockNarrativeProvider(),
        );

  return {
    marketData,
    stockToken: wrapProviderWithHealthLogging(
      "mock-stock-token",
      new MockStockTokenProvider(),
    ),
    narrative,
    social: wrapProviderWithHealthLogging(
      "mock-social",
      new MockSocialProvider(),
    ),
  };
}
