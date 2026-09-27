import type {
  MarketSnapshot,
  SignalObservation,
  StockAsset,
} from "@jevo/protocol-types";

export type { MarketSnapshot, SignalObservation, StockAsset };

export interface MarketDataProvider {
  getSnapshot(symbol: string): Promise<MarketSnapshot>;
  getSnapshots(symbols: string[]): Promise<MarketSnapshot[]>;
}

export interface StockTokenProvider {
  /** Resolves the canonical Robinhood Chain contract address for a stock ticker */
  getCanonicalAddress(symbol: string): Promise<string | null>;

  /** Reads the authoritative on-chain price feed (e.g. Chainlink oracle) */
  getOnchainPrice(address: string): Promise<{ price: number; capturedAt: string; isStale?: boolean }>;

  /**
   * Discovers and syncs the token catalog from the external Robinhood Chain registry.
   * NOTE: This is an external synchronization primitive used to refresh/populate
   * the local Postgres `assets` table.
   * In contrast, Agent Cycle Step 2 reads its active universe directly from the
   * local `assets` database table (`db.select().from(assets)`), NOT from this method.
   */
  listActiveAssets(): Promise<StockAsset[]>;
}

export interface NarrativeProvider {
  getSignals(symbol: string, since?: string): Promise<SignalObservation[]>;
}

export interface SocialProvider {
  getVelocity(symbol: string, since?: string): Promise<SignalObservation[]>;
}

export interface ProvidersRegistry {
  marketData: MarketDataProvider;
  stockToken: StockTokenProvider;
  narrative: NarrativeProvider;
  social: SocialProvider;
}
