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
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  AMZN: {
    symbol: "AMZN",
    name: "Amazon Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  META: {
    symbol: "META",
    name: "Meta Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  AVGO: {
    symbol: "AVGO",
    name: "Broadcom Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  MSTR: {
    symbol: "MSTR",
    name: "MicroStrategy Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  HOOD: {
    symbol: "HOOD",
    name: "Robinhood Stock Token",
    stockTokenAddress: null,
    active: true,
  },
  SOFI: {
    symbol: "SOFI",
    name: "SoFi Stock Token",
    stockTokenAddress: null,
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
  MSFT: { symbol: "MSFT", price: 428.5, volume24h: 21500000, volatility: 0.24, source: "mock-polygon" },
  GOOGL: { symbol: "GOOGL", price: 182.3, volume24h: 24000000, volatility: 0.28, source: "mock-polygon" },
  AMZN: { symbol: "AMZN", price: 194.8, volume24h: 26000000, volatility: 0.31, source: "mock-polygon" },
  META: { symbol: "META", price: 588.2, volume24h: 17500000, volatility: 0.36, source: "mock-polygon" },
  AVGO: { symbol: "AVGO", price: 172.5, volume24h: 15200000, volatility: 0.41, source: "mock-polygon" },
  MSTR: { symbol: "MSTR", price: 188.4, volume24h: 16800000, volatility: 0.72, source: "mock-polygon" },
  HOOD: { symbol: "HOOD", price: 28.6, volume24h: 19500000, volatility: 0.58, source: "mock-polygon" },
  SOFI: { symbol: "SOFI", price: 9.8, volume24h: 28000000, volatility: 0.62, source: "mock-polygon" },
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
  MSFT: [
    { symbol: "MSFT", kind: "NARRATIVE", magnitude: 92, label: "Copilot enterprise AI expansion and azure workload growth", source: "mock-narrative" },
  ],
  GOOGL: [
    { symbol: "GOOGL", kind: "NARRATIVE", magnitude: 90, label: "Gemini ecosystem integration across consumer platforms", source: "mock-narrative" },
  ],
  AMZN: [
    { symbol: "AMZN", kind: "NARRATIVE", magnitude: 89, label: "AWS custom silicon and enterprise cloud acceleration", source: "mock-narrative" },
  ],
  META: [
    { symbol: "META", kind: "NARRATIVE", magnitude: 94, label: "Open-source Llama adoption powering ecosystem momentum", source: "mock-narrative" },
  ],
  AVGO: [
    { symbol: "AVGO", kind: "NARRATIVE", magnitude: 91, label: "Custom AI ASIC accelerator demand and networking rails", source: "mock-narrative" },
  ],
  MSTR: [
    { symbol: "MSTR", kind: "NARRATIVE", magnitude: 96, label: "Bitcoin treasury accumulation narrative expanding", source: "mock-narrative" },
  ],
  HOOD: [
    { symbol: "HOOD", kind: "NARRATIVE", magnitude: 88, label: "Retail trading tokenization and crypto revenue velocity", source: "mock-narrative" },
  ],
  SOFI: [
    { symbol: "SOFI", kind: "NARRATIVE", magnitude: 85, label: "Digital banking expansion and lending platform recovery", source: "mock-narrative" },
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
  MSFT: [
    { symbol: "MSFT", kind: "SOCIAL", magnitude: 86, label: "Enterprise developer sentiment remains consistently positive", source: "mock-social" },
  ],
  GOOGL: [
    { symbol: "GOOGL", kind: "SOCIAL", magnitude: 88, label: "AI research benchmarks sparking developer discussions", source: "mock-social" },
  ],
  AMZN: [
    { symbol: "AMZN", kind: "SOCIAL", magnitude: 83, label: "E-commerce and cloud margins tracking analyst discussions", source: "mock-social" },
  ],
  META: [
    { symbol: "META", kind: "SOCIAL", magnitude: 92, label: "Open-source developer enthusiasm surging around models", source: "mock-social" },
  ],
  AVGO: [
    { symbol: "AVGO", kind: "SOCIAL", magnitude: 81, label: "Semiconductor supply chain discussions active", source: "mock-social" },
  ],
  MSTR: [
    { symbol: "MSTR", kind: "SOCIAL", magnitude: 97, label: "Crypto twitter velocity exceptionally elevated", source: "mock-social" },
  ],
  HOOD: [
    { symbol: "HOOD", kind: "SOCIAL", magnitude: 90, label: "Retail volume chatter following crypto product releases", source: "mock-social" },
  ],
  SOFI: [
    { symbol: "SOFI", kind: "SOCIAL", magnitude: 84, label: "Fintech community sentiment steady on rate cut expectations", source: "mock-social" },
  ],
};
