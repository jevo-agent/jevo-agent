import type { MarketSnapshot, SignalObservation, StockAsset } from "../types";

export const MOCK_ASSETS: Record<string, StockAsset> = {
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000001",
    active: true,
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000002",
    active: true,
  },
  PLTR: {
    symbol: "PLTR",
    name: "Palantir Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000003",
    active: true,
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000004",
    active: true,
  },
  GME: {
    symbol: "GME",
    name: "GameStop Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000005",
    active: true,
  },
  AMD: {
    symbol: "AMD",
    name: "AMD Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000006",
    active: true,
  },
  COIN: {
    symbol: "COIN",
    name: "Coinbase Stock Token",
    stockTokenAddress: "0x1000000000000000000000000000000000000007",
    active: true,
  },
};

export const MOCK_MARKET_DATA: Record<string, Omit<MarketSnapshot, "id" | "capturedAt">> = {
  NVDA: { symbol: "NVDA", price: 128.45, volume24h: 42000000, volatility: 0.38, source: "mock-polygon" },
  TSLA: { symbol: "TSLA", price: 248.5, volume24h: 31000000, volatility: 0.42, source: "mock-polygon" },
  PLTR: { symbol: "PLTR", price: 36.8, volume24h: 18500000, volatility: 0.35, source: "mock-polygon" },
  AAPL: { symbol: "AAPL", price: 228.1, volume24h: 29000000, volatility: 0.22, source: "mock-polygon" },
  GME: { symbol: "GME", price: 22.4, volume24h: 14500000, volatility: 0.65, source: "mock-polygon" },
  AMD: { symbol: "AMD", price: 156.2, volume24h: 19800000, volatility: 0.33, source: "mock-polygon" },
  COIN: { symbol: "COIN", price: 192.3, volume24h: 11200000, volatility: 0.55, source: "mock-polygon" },
};

export const MOCK_NARRATIVE_DATA: Record<string, Array<Omit<SignalObservation, "id" | "capturedAt">>> = {
  NVDA: [
    { symbol: "NVDA", kind: "NARRATIVE", magnitude: 98, label: "AI infrastructure accelerating into dominant narrative", source: "mock-narrative" },
    { symbol: "NVDA", kind: "NEWS", magnitude: 91, label: "Major enterprise cloud providers expand GPU orders", source: "mock-news" },
  ],
  TSLA: [
    { symbol: "TSLA", kind: "NARRATIVE", magnitude: 93, label: "Robotics and autonomous systems attention expanding", source: "mock-narrative" },
  ],
  PLTR: [
    { symbol: "PLTR", kind: "NARRATIVE", magnitude: 91, label: "Enterprise AI and intelligence observation systems persistent", source: "mock-narrative" },
  ],
  AAPL: [
    { symbol: "AAPL", kind: "NARRATIVE", magnitude: 86, label: "Consumer hardware AI integration roadmap updates", source: "mock-narrative" },
  ],
  GME: [
    { symbol: "GME", kind: "NARRATIVE", magnitude: 89, label: "Retail reflexivity and meme return dynamics reactivating", source: "mock-narrative" },
  ],
  AMD: [
    { symbol: "AMD", kind: "NARRATIVE", magnitude: 88, label: "Compute cluster expansion and datacenter chip roadmap", source: "mock-narrative" },
  ],
  COIN: [
    { symbol: "COIN", kind: "NARRATIVE", magnitude: 90, label: "Onchain market liquidity and stablecoin volume growth", source: "mock-narrative" },
  ],
};

export const MOCK_SOCIAL_DATA: Record<string, Array<Omit<SignalObservation, "id" | "capturedAt">>> = {
  NVDA: [
    { symbol: "NVDA", kind: "SOCIAL", magnitude: 89, label: "Developer and retail attention velocity rising rapidly", source: "mock-social" },
  ],
  TSLA: [
    { symbol: "TSLA", kind: "SOCIAL", magnitude: 91, label: "Autonomy discussions and retail sentiment surging", source: "mock-social" },
  ],
  PLTR: [
    { symbol: "PLTR", kind: "SOCIAL", magnitude: 88, label: "Observation motif persisting across crypto native feeds", source: "mock-social" },
  ],
  AAPL: [
    { symbol: "AAPL", kind: "SOCIAL", magnitude: 84, label: "Consumer tech conversation remains stable without spike", source: "mock-social" },
  ],
  GME: [
    { symbol: "GME", kind: "SOCIAL", magnitude: 96, label: "Sharp volume increase across retail communities", source: "mock-social" },
  ],
  AMD: [
    { symbol: "AMD", kind: "SOCIAL", magnitude: 82, label: "Hardware discussions tracking AI model benchmarks", source: "mock-social" },
  ],
  COIN: [
    { symbol: "COIN", kind: "SOCIAL", magnitude: 87, label: "Crypto trader velocity tracking exchange volumes", source: "mock-social" },
  ],
};
