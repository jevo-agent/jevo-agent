import { logger } from "../../observability/logger";
import { DEFAULT_DEXPAPRIKA_API_URL } from "./constants";

export interface DexPaprikaTokenResponse {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  decimals: number;
  total_supply?: number | null;
  summary?: {
    price_usd?: number;
    liquidity_usd?: number;
    "24h"?: {
      volume_usd?: number;
      txns?: number;
    };
  };
  last_updated?: string;
}

export interface DexPaprikaClientOptions {
  baseUrl?: string;
  cacheTtlMs?: number;
  requestTimeoutMs?: number;
}

interface CacheEntry {
  data: DexPaprikaTokenResponse;
  expiresAt: number;
}

export class DexPaprikaClient {
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly requestTimeoutMs: number;

  private readonly cache = new Map<string, CacheEntry>();
  private readonly staleFallback = new Map<string, DexPaprikaTokenResponse>();
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 120; // safe pacing between consecutive outbound HTTP requests

  constructor(options: DexPaprikaClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_DEXPAPRIKA_API_URL;
    this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 8_000;
  }

  private async pace(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async getTokenDetails(tokenAddress: string): Promise<DexPaprikaTokenResponse> {
    const normalized = tokenAddress.toLowerCase();
    const now = Date.now();

    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    await this.pace();

    const url = `${this.baseUrl}/networks/robinhood/tokens/${normalized}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        // If rate limited (429) or remote error, fallback to stale cache if present
        if (this.staleFallback.has(normalized)) {
          logger.warn(
            { tokenAddress: normalized, status: res.status },
            "DexPaprika error or rate limited; falling back to stale cache",
          );
          return this.staleFallback.get(normalized)!;
        }
        throw new Error(`DexPaprika request failed for ${normalized}: HTTP ${res.status}`);
      }

      const data = (await res.json()) as DexPaprikaTokenResponse;
      this.cache.set(normalized, { data, expiresAt: now + this.cacheTtlMs });
      this.staleFallback.set(normalized, data);
      return data;
    } catch (err) {
      if (this.staleFallback.has(normalized)) {
        logger.warn(
          { tokenAddress: normalized, err },
          "DexPaprika fetch exception; falling back to stale cache",
        );
        return this.staleFallback.get(normalized)!;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<{ price: number; capturedAt: string }> {
    const details = await this.getTokenDetails(tokenAddress);
    const price = details.summary?.price_usd;

    if (typeof price !== "number" || isNaN(price)) {
      throw new Error(
        `DexPaprika returned invalid or missing price_usd for token ${tokenAddress}`,
      );
    }

    return {
      price,
      capturedAt: details.last_updated || new Date().toISOString(),
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.staleFallback.clear();
  }
}
