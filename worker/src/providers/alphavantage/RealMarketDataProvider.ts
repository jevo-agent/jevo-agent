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

    const rawPrice = raw["05. price"];
    if (!rawPrice) {
      throw new Error(
        `AlphaVantage returned missing price for symbol ${uppercaseSymbol}`,
      );
    }
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price <= 0) {
      throw new Error(
        `AlphaVantage returned non-positive or invalid price (${rawPrice}) for symbol ${uppercaseSymbol}`,
      );
    }

    const rawHigh = raw["03. high"];
    const rawLow = raw["04. low"];
    if (!rawHigh || !rawLow) {
      throw new Error(
        `AlphaVantage returned missing high/low price for symbol ${uppercaseSymbol}`,
      );
    }
    const high = parseFloat(rawHigh);
    const low = parseFloat(rawLow);
    if (isNaN(high) || isNaN(low) || high <= 0 || low <= 0 || high < low) {
      throw new Error(
        `AlphaVantage returned invalid high/low range [${rawLow}, ${rawHigh}] for symbol ${uppercaseSymbol}`,
      );
    }

    const rawVolume = raw["06. volume"];
    if (rawVolume === undefined || rawVolume === null || rawVolume.trim() === "") {
      throw new Error(
        `AlphaVantage returned missing volume for symbol ${uppercaseSymbol}`,
      );
    }
    const volume24h = parseInt(rawVolume, 10);
    if (isNaN(volume24h) || volume24h < 0) {
      throw new Error(
        `AlphaVantage returned invalid volume (${rawVolume}) for symbol ${uppercaseSymbol}`,
      );
    }

    // Calculate intraday volatility (high - low) / price, bounded between 0.005 and 1.0
    const intradayRange = (high - low) / price;
    const volatility = Math.min(
      1.0,
      Math.max(0.005, Number(intradayRange.toFixed(4))),
    );

    const tradingDay = raw["07. latest trading day"];
    if (!tradingDay || tradingDay.trim() === "") {
      throw new Error(
        `AlphaVantage returned missing latest trading day for symbol ${uppercaseSymbol}`,
      );
    }
    const date = new Date(tradingDay);
    if (isNaN(date.getTime())) {
      throw new Error(
        `AlphaVantage returned malformed latest trading day (${tradingDay}) for symbol ${uppercaseSymbol}`,
      );
    }
    const capturedAt = date.toISOString();

    return {
      id: `mkt-${uppercaseSymbol.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      symbol: uppercaseSymbol,
      price,
      volume24h,
      volatility,
      capturedAt,
      source: "alphavantage",
      ...(raw.isStale ? { isStale: true } : {}),
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
