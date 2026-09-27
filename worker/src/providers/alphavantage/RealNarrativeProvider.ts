import { randomUUID } from "node:crypto";
import { env } from "../../config/env";
import type { NarrativeProvider, SignalObservation } from "../types";
import { AlphaVantageClient } from "./client";

export interface RealNarrativeProviderOptions {
  apiKey?: string;
  cacheTtlMs?: number;
  client?: AlphaVantageClient;
}

function parseTimePublished(raw?: string): string {
  if (!raw || raw.length < 8) return new Date().toISOString();
  // Format: YYYYMMDDTHHMMSS -> e.g. 20260926T161439
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const rest = raw.slice(9);
  const hours = rest.slice(0, 2) || "00";
  const mins = rest.slice(2, 4) || "00";
  const secs = rest.slice(4, 6) || "00";
  const iso = `${year}-${month}-${day}T${hours}:${mins}:${secs}Z`;
  const date = new Date(iso);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export class RealNarrativeProvider implements NarrativeProvider {
  readonly client: AlphaVantageClient;

  constructor(options: RealNarrativeProviderOptions = {}) {
    if (options.client) {
      this.client = options.client;
    } else {
      const apiKey = options.apiKey ?? env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(
          "RealNarrativeProvider requires ALPHA_VANTAGE_API_KEY in environment or options",
        );
      }
      this.client = new AlphaVantageClient({
        apiKey,
        cacheTtlMs: options.cacheTtlMs ?? env.ALPHA_VANTAGE_CACHE_TTL_MS,
      });
    }
  }

  async getSignals(symbol: string, _since?: string): Promise<SignalObservation[]> {
    const uppercaseSymbol = symbol.toUpperCase();
    const news = await this.client.getNewsSentiment(uppercaseSymbol);

    const feed = news.feed ?? [];
    if (feed.length === 0) {
      return [];
    }

    // Filter articles with specific sentiment for this symbol, take top 5
    const results: SignalObservation[] = [];
    for (let idx = 0; idx < Math.min(5, feed.length); idx++) {
      const article = feed[idx];
      const tickerInfo = article.ticker_sentiment?.find(
        (t) => t.ticker.toUpperCase() === uppercaseSymbol,
      );

      // Raw sentiment score ranges from -1.0 (bearish) to +1.0 (bullish)
      const rawScore = tickerInfo
        ? parseFloat(tickerInfo.ticker_sentiment_score)
        : article.overall_sentiment_score;

      // Map [-1.0, 1.0] to [0, 100]
      const normalizedScore = isNaN(rawScore) ? 0 : rawScore;
      const magnitude = Math.min(
        100,
        Math.max(0, Math.round(((normalizedScore + 1) / 2) * 100)),
      );

      results.push({
        id: `sig-nar-${uppercaseSymbol.toLowerCase()}-${idx}-${randomUUID().slice(0, 8)}`,
        symbol: uppercaseSymbol,
        kind: "NEWS",
        magnitude,
        label: article.title.slice(0, 150),
        capturedAt: parseTimePublished(article.time_published),
        source: "alphavantage",
      });
    }

    return results;
  }
}
