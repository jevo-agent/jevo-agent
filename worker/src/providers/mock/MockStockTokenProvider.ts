import type { StockAsset, StockTokenProvider } from "../types";
import { MOCK_ASSETS, MOCK_MARKET_DATA } from "./fixtures";

export class MockStockTokenProvider implements StockTokenProvider {
  async getCanonicalAddress(symbol: string): Promise<string | null> {
    const asset = MOCK_ASSETS[symbol.toUpperCase()];
    return asset?.stockTokenAddress ?? null;
  }

  async getOnchainPrice(address: string): Promise<{ price: number; capturedAt: string }> {
    const asset = Object.values(MOCK_ASSETS).find(
      (a) => a.stockTokenAddress.toLowerCase() === address.toLowerCase(),
    );

    const price = asset ? (MOCK_MARKET_DATA[asset.symbol]?.price ?? 100.0) : 100.0;

    return {
      price,
      capturedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns active assets discovered from the external mock registry.
   * Used for initial catalog sync/seed, separate from cycle execution.
   */
  async listActiveAssets(): Promise<StockAsset[]> {
    return Object.values(MOCK_ASSETS).filter((a) => a.active);
  }
}
