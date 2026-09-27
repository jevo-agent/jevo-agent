import type { StockAsset } from "../types";

export const ROBINHOOD_CHAIN_ID = 4663;
export const DEFAULT_ROBINHOOD_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
export const DEFAULT_DEXPAPRIKA_API_URL = "https://api.dexpaprika.com";
export const ROBINHOOD_BEACON_ADDRESS = "0xe10b6f6b275de231345c20d14ab812db62151b00" as const;

export interface RobinhoodStockTokenMetadata extends StockAsset {
  decimals: number;
  chainId: number;
  beaconAddress: string;
}

/**
 * Canonical verified Robinhood Chain Mainnet tokenized equity contracts (Chain ID 4663).
 * Deployed under Beacon Proxy 0xe10b6f6b275de231345c20d14ab812db62151b00.
 */
export const CANONICAL_ROBINHOOD_STOCK_TOKENS: Record<string, RobinhoodStockTokenMetadata> = {
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA • Robinhood Token",
    stockTokenAddress: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla • Robinhood Token",
    stockTokenAddress: "0x322f0929c4625ed5bad873c95208d54e1c003b2d",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  PLTR: {
    symbol: "PLTR",
    name: "Palantir Technologies • Robinhood Token",
    stockTokenAddress: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple • Robinhood Token",
    stockTokenAddress: "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  GME: {
    symbol: "GME",
    name: "GameStop • Robinhood Token",
    stockTokenAddress: "0x1b0e319c6a659f002271b69db8a7df2f911c153e",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  AMD: {
    symbol: "AMD",
    name: "AMD • Robinhood Token",
    stockTokenAddress: "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
  COIN: {
    symbol: "COIN",
    name: "Coinbase • Robinhood Token",
    stockTokenAddress: "0x6330d8c3178a418788df01a47479c0ce7ccf450b",
    active: true,
    decimals: 18,
    chainId: ROBINHOOD_CHAIN_ID,
    beaconAddress: ROBINHOOD_BEACON_ADDRESS,
  },
};
