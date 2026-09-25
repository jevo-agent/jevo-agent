import { randomUUID } from "node:crypto";
import type { MarketDataProvider, MarketSnapshot } from "../types";
import { MOCK_MARKET_DATA } from "./fixtures";

export class MockMarketDataProvider implements MarketDataProvider {
  async getSnapshot(symbol: string): Promise<MarketSnapshot> {
    const uppercaseSymbol = symbol.toUpperCase();
    const data = MOCK_MARKET_DATA[uppercaseSymbol] ?? {
      symbol: uppercaseSymbol,
      price: 100.0,
      volume24h: 1000000,
      volatility: 0.3,
      source: "mock-polygon",
    };

    return {
      id: `mkt-${uppercaseSymbol.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      symbol: uppercaseSymbol,
      price: data.price,
      volume24h: data.volume24h,
      volatility: data.volatility,
      capturedAt: new Date().toISOString(),
      source: data.source,
    };
  }

  async getSnapshots(symbols: string[]): Promise<MarketSnapshot[]> {
    return Promise.all(symbols.map((symbol) => this.getSnapshot(symbol)));
  }
}
