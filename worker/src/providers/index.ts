import { env } from "../config/env";
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

export function createProvidersRegistry(
  mode: "mock" | "real" = env.PROVIDER_MODE,
): ProvidersRegistry {
  if (mode === "real") {
    // Real vendors will be plugged in once vendor decisions are finalized (Section 22)
    throw new Error("Real providers not yet integrated. Configure PROVIDER_MODE=mock.");
  }

  return {
    marketData: wrapProviderWithHealthLogging(
      "mock-market-data",
      new MockMarketDataProvider(),
    ),
    stockToken: wrapProviderWithHealthLogging(
      "mock-stock-token",
      new MockStockTokenProvider(),
    ),
    narrative: wrapProviderWithHealthLogging(
      "mock-narrative",
      new MockNarrativeProvider(),
    ),
    social: wrapProviderWithHealthLogging(
      "mock-social",
      new MockSocialProvider(),
    ),
  };
}
