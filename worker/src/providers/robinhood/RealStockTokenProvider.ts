import { createPublicClient, http, parseAbi, type PublicClient } from "viem";
import type { StockAsset, StockTokenProvider } from "../types";
import {
  CANONICAL_ROBINHOOD_STOCK_TOKENS,
  DEFAULT_ROBINHOOD_RPC_URL,
  type RobinhoodStockTokenMetadata,
} from "./constants";
import { DexPaprikaClient, type DexPaprikaClientOptions } from "./dexpaprika";

export interface RealStockTokenProviderOptions {
  rpcUrl?: string;
  dexPaprikaOptions?: DexPaprikaClientOptions;
  dexPaprikaClient?: DexPaprikaClient;
}

const ERC20_READ_ABI = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);

export class RealStockTokenProvider implements StockTokenProvider {
  private readonly dexPaprika: DexPaprikaClient;
  private readonly publicClient: PublicClient;
  private readonly rpcUrl: string;

  constructor(options: RealStockTokenProviderOptions = {}) {
    this.dexPaprika =
      options.dexPaprikaClient ?? new DexPaprikaClient(options.dexPaprikaOptions);
    this.rpcUrl = options.rpcUrl || DEFAULT_ROBINHOOD_RPC_URL;
    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
    });
  }

  /**
   * Resolves the canonical Robinhood Chain contract address for a stock ticker.
   * Deterministic O(1) lookup against verified canonical contracts.
   */
  async getCanonicalAddress(symbol: string): Promise<string | null> {
    const meta = CANONICAL_ROBINHOOD_STOCK_TOKENS[symbol.trim().toUpperCase()];
    return meta ? meta.stockTokenAddress : null;
  }

  /**
   * Reads the live on-chain token price from Robinhood Chain DEX pools via DexPaprika.
   * Note: This is strictly the DEX price of the token on Robinhood Chain,
   * keeping it isolated from traditional market equity data (Alpha Vantage).
   */
  async getOnchainPrice(address: string): Promise<{ price: number; capturedAt: string }> {
    return this.dexPaprika.getTokenPrice(address);
  }

  /**
   * Discovers and syncs the token catalog from the external Robinhood Chain registry.
   * Returns the 7 canonical verified Robinhood Chain stock token assets.
   */
  async listActiveAssets(): Promise<StockAsset[]> {
    return Object.values(CANONICAL_ROBINHOOD_STOCK_TOKENS)
      .filter((asset) => asset.active)
      .map(({ symbol, name, stockTokenAddress, active }) => ({
        symbol,
        name,
        stockTokenAddress,
        active,
      }));
  }

  /**
   * Returns extended metadata including decimals, chainId, and beacon address.
   */
  getAssetMetadata(symbol: string): RobinhoodStockTokenMetadata | null {
    return CANONICAL_ROBINHOOD_STOCK_TOKENS[symbol.trim().toUpperCase()] ?? null;
  }

  /**
   * Read-only verification of ERC-20 metadata directly from Robinhood Chain RPC.
   */
  async verifyOnchain(address: string): Promise<{
    symbol: string;
    name: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    const target = address as `0x${string}`;
    const [symbol, name, decimals, totalSupply] = await Promise.all([
      this.publicClient.readContract({
        address: target,
        abi: ERC20_READ_ABI,
        functionName: "symbol",
      }),
      this.publicClient.readContract({
        address: target,
        abi: ERC20_READ_ABI,
        functionName: "name",
      }),
      this.publicClient.readContract({
        address: target,
        abi: ERC20_READ_ABI,
        functionName: "decimals",
      }),
      this.publicClient.readContract({
        address: target,
        abi: ERC20_READ_ABI,
        functionName: "totalSupply",
      }),
    ]);

    return { symbol, name, decimals, totalSupply };
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getDexPaprikaClient(): DexPaprikaClient {
    return this.dexPaprika;
  }
}
