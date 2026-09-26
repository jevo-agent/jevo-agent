import { randomUUID } from "node:crypto";
import { env } from "../../config/env";
import type { MarketDataProvider, MarketSnapshot } from "../types";
import { AlphaVantageClient } from "./client";

export interface RealMarketDataProviderOptions {
  apiKey?: string;
  cacheTtlMs?: number;
  client?: AlphaVantageClient;
}

export class RealMarketDataProvider implements MarketDataProvider {
  readonly client: AlphaVantageClient;

  constructor(options: RealMarketDataProviderOptions = {}) {
    if (options.client) {
      this.client = options.client;
    } else {
      const apiKey = options.apiKey ?? env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(
          "RealMarketDataProvider requires ALPHA_VANTAGE_API_KEY in environment or options",
        );
      }
      this.client = new AlphaVantageClient({
        apiKey,
        cacheTtlMs: options.cacheTtlMs ?? env.ALPHA_VANTAGE_CACHE_TTL_MS,
      });
    }
  }

  async getSnapshot(symbol: string): Promise<MarketSnapshot> {
    const uppercaseSymbol = symbol.toUpperCase();
    const raw = await this.client.getGlobalQuote(uppercaseSymbol);

    const price = parseFloat(raw["05. price"] ?? "0");
    const high = parseFloat(raw["03. high"] ?? "0");
    const low = parseFloat(raw["04. low"] ?? "0");
    const volume24h = parseInt(raw["06. volume"] ?? "0", 10);

    // Calculate intraday volatility (high - low) / price, bounded between 0.005 and 1.0
    const intradayRange =
      high > 0 && low > 0 && price > 0 ? (high - low) / price : 0.02;
    const volatility = Math.min(
      1.0,
      Math.max(0.005, Number(intradayRange.toFixed(4))),
    );

    const capturedAt = raw["07. latest trading day"]
      ? new Date(raw["07. latest trading day"]).toISOString()
      : new Date().toISOString();

    return {
      id: `mkt-${uppercaseSymbol.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      symbol: uppercaseSymbol,
      price: price > 0 ? price : 100.0,
      volume24h: volume24h > 0 ? volume24h : 1_000_000,
      volatility,
      capturedAt,
      source: "alphavantage",
    };
  }

  async getSnapshots(symbols: string[]): Promise<MarketSnapshot[]> {
    const results: MarketSnapshot[] = [];
    for (const sym of symbols) {
      results.push(await this.getSnapshot(sym));
    }
    return results;
  }
}
