import { logger } from "../../observability/logger";

export interface AlphaVantageRawQuote {
  "01. symbol"?: string;
  "02. open"?: string;
  "03. high"?: string;
  "04. low"?: string;
  "05. price"?: string;
  "06. volume"?: string;
  "07. latest trading day"?: string;
  "08. previous close"?: string;
  "09. change"?: string;
  "10. change percent"?: string;
  isStale?: boolean;
}

export interface AlphaVantageNewsArticle {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

export interface AlphaVantageNewsResponse {
  items?: string;
  feed?: AlphaVantageNewsArticle[];
  isStale?: boolean;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export interface AlphaVantageClientOptions {
  apiKey: string;
  cacheTtlMs?: number;
  maxDailyRequests?: number;
}

export class AlphaVantageClient {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://www.alphavantage.co/query";
  private readonly cacheTtlMs: number;
  private readonly minIntervalMs: number = 1250; // Rate limit: max 1 req/sec on free tier
  private readonly maxDailyRequests: number;
  private dailyRequestCount: number = 0;
  private dailyWindowStart: number = Date.now();
  private lastRequestTime: number = 0;
  private requestQueue: Promise<void> = Promise.resolve();

  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(options: AlphaVantageClientOptions) {
    this.apiKey = options.apiKey.trim();
    // Default TTL: 22 hours to match daily EOD cadence and conserve 25 req/day quota
    this.cacheTtlMs = options.cacheTtlMs ?? 22 * 60 * 60 * 1000;
    this.maxDailyRequests = options.maxDailyRequests ?? 25;
  }

  private async acquireRateLimitSlot(): Promise<void> {
    const previousQueue = this.requestQueue;
    let releaseSlot: () => void;
    this.requestQueue = new Promise<void>((resolve) => {
      releaseSlot = resolve;
    });

    await previousQueue;

    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
    releaseSlot!();
  }

  private tryConsumeDailyQuota(): boolean {
    const now = Date.now();
    if (now - this.dailyWindowStart >= 24 * 60 * 60 * 1000) {
      this.dailyRequestCount = 0;
      this.dailyWindowStart = now;
    }

    if (this.dailyRequestCount >= this.maxDailyRequests) {
      logger.warn(
        { count: this.dailyRequestCount, max: this.maxDailyRequests },
        "Alpha Vantage daily request quota reached. Refusing outbound call and falling back to cached state.",
      );
      return false;
    }

    this.dailyRequestCount++;
    return true;
  }

  private async fetchWithPacing(url: string): Promise<Record<string, unknown>> {
    await this.acquireRateLimitSlot();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as Record<string, unknown>;

    // Check for Alpha Vantage rate limit messages or notes
    if (typeof json.Information === "string") {
      logger.warn({ info: json.Information }, "Alpha Vantage returned rate limit Information notice");
    }
    if (typeof json.Note === "string") {
      logger.warn({ note: json.Note }, "Alpha Vantage returned usage Note notice");
    }

    return json;
  }

  async getGlobalQuote(symbol: string): Promise<AlphaVantageRawQuote> {
    const uppercaseSymbol = symbol.toUpperCase();
    const cacheKey = `quote:${uppercaseSymbol}`;

    const cached = this.cache.get(cacheKey) as CacheEntry<AlphaVantageRawQuote> | undefined;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (!this.tryConsumeDailyQuota()) {
      if (cached) {
        logger.warn({ symbol: uppercaseSymbol }, "Daily quota reached: returning stale cached quote");
        return { ...cached.data, isStale: true };
      }
      return {};
    }

    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(uppercaseSymbol)}&apikey=${encodeURIComponent(this.apiKey)}`;
    try {
      const json = await this.fetchWithPacing(url);
      const rawQuote = (json["Global Quote"] as AlphaVantageRawQuote) ?? {};

      if (rawQuote["05. price"]) {
        this.cache.set(cacheKey, {
          data: rawQuote,
          cachedAt: Date.now(),
          expiresAt: Date.now() + this.cacheTtlMs,
        });
        return rawQuote;
      }

      // If rate limited or empty, fallback to stale cache if present
      if (cached) {
        logger.warn({ symbol: uppercaseSymbol }, "Using stale cached quote due to empty/rate-limited response");
        return { ...cached.data, isStale: true };
      }

      return rawQuote;
    } catch (err) {
      if (cached) {
        logger.warn({ symbol: uppercaseSymbol, err }, "Using stale cached quote due to network error");
        return { ...cached.data, isStale: true };
      }
      throw err;
    }
  }

  async getNewsSentiment(symbol: string): Promise<AlphaVantageNewsResponse> {
    const uppercaseSymbol = symbol.toUpperCase();
    const cacheKey = `news:${uppercaseSymbol}`;

    const cached = this.cache.get(cacheKey) as CacheEntry<AlphaVantageNewsResponse> | undefined;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (!this.tryConsumeDailyQuota()) {
      if (cached) {
        logger.warn({ symbol: uppercaseSymbol }, "Daily quota reached: returning stale cached news");
        return { ...cached.data, isStale: true };
      }
      return { feed: [] };
    }

    const url = `${this.baseUrl}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(uppercaseSymbol)}&apikey=${encodeURIComponent(this.apiKey)}`;
    try {
      const json = await this.fetchWithPacing(url);
      const response: AlphaVantageNewsResponse = {
        items: typeof json.items === "string" ? json.items : undefined,
        feed: Array.isArray(json.feed) ? (json.feed as AlphaVantageNewsArticle[]) : [],
      };

      if (response.feed && response.feed.length > 0) {
        this.cache.set(cacheKey, {
          data: response,
          cachedAt: Date.now(),
          expiresAt: Date.now() + this.cacheTtlMs,
        });
        return response;
      }

      if (cached) {
        logger.warn({ symbol: uppercaseSymbol }, "Using stale cached news due to empty/rate-limited response");
        return { ...cached.data, isStale: true };
      }

      return response;
    } catch (err) {
      if (cached) {
        logger.warn({ symbol: uppercaseSymbol, err }, "Using stale cached news due to network error");
        return { ...cached.data, isStale: true };
      }
      throw err;
    }
  }

  getDailyRequestCount(): number {
    return this.dailyRequestCount;
  }

  resetDailyQuota(): void {
    this.dailyRequestCount = 0;
    this.dailyWindowStart = Date.now();
  }

  /** Exposes cache inspection for testing */
  hasCached(key: string): boolean {
    const entry = this.cache.get(key);
    return Boolean(entry && Date.now() < entry.expiresAt);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
