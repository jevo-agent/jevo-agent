import type { ScoreWeights } from "./weights";

export interface OpportunityComponents {
  marketMomentum: number;
  narrativeMomentum: number;
  socialVelocity: number;
  culturalRelevance: number;
  memeCompatibility: number;
  cryptoAdjacency: number;
  pairCompatibility: number;
}

export interface RawMarketSnapshot {
  price: number;
  volume24h: number;
  volatility: number;
  change24hPct?: number;
}

export interface RawMarketDataInput {
  current: RawMarketSnapshot;
  previous?: RawMarketSnapshot | null;
}

export interface RawSocialObservation {
  magnitude: number;
  capturedAt?: string | Date;
}

export interface RawSocialDataInput {
  observations?: RawSocialObservation[];
  currentMagnitude?: number;
  previousMagnitude?: number | null;
}

export interface QualitativeJevScores {
  narrativeMomentum: number;
  culturalRelevance: number;
  memeCompatibility: number;
  cryptoAdjacency: number;
  pairCompatibility: number;
}

/**
 * Deterministically computes Market Momentum (0-100) from raw market data.
 * Section 8: "Price/volume/volatility deltas — pure math".
 */
export function computeMarketMomentum(input: RawMarketDataInput): number {
  const { current, previous } = input;

  if (previous && previous.price > 0) {
    const priceDeltaPct = ((current.price - previous.price) / previous.price) * 100;
    const volumeDeltaPct =
      previous.volume24h > 0
        ? ((current.volume24h - previous.volume24h) / previous.volume24h) * 100
        : 0;
    const volatilityDelta = current.volatility - previous.volatility;

    // Price delta contributes significantly (+-2.5 pts per 1% change)
    const priceComponent = priceDeltaPct * 2.5;
    // Volume delta capped at +-15 pts
    const volumeComponent = Math.max(-15, Math.min(15, volumeDeltaPct * 0.2));
    // Volatility spike penalty
    const volPenalty = volatilityDelta * 15;

    const baseScore = 50 + priceComponent + volumeComponent - volPenalty;
    return Math.round(Math.max(0, Math.min(100, baseScore)) * 100) / 100;
  }

  // Baseline if no prior cycle snapshot exists (e.g. cold start)
  const priceChange = current.change24hPct ?? 0;
  const volumeFactor = Math.min(25, Math.max(0, Math.log10(Math.max(1, current.volume24h)) * 3));
  const volFactor = Math.min(15, current.volatility * 20);

  const baselineScore = 50 + priceChange * 2.5 + (volumeFactor - 12.5) - (volFactor - 7.5);
  return Math.round(Math.max(0, Math.min(100, baselineScore)) * 100) / 100;
}

/**
 * Deterministically computes Social Velocity (0-100) from raw social observations.
 * Section 8: "Rate of change of signal magnitude over time — pure math".
 */
export function computeSocialVelocity(input: RawSocialDataInput): number {
  // If direct magnitudes provided:
  if (typeof input.currentMagnitude === "number") {
    const curr = input.currentMagnitude;
    if (typeof input.previousMagnitude === "number") {
      const delta = curr - input.previousMagnitude;
      const score = curr + delta * 0.5;
      return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
    }
    return Math.round(Math.max(0, Math.min(100, curr)) * 100) / 100;
  }

  // If signal observations array provided:
  const obs = input.observations ?? [];
  if (obs.length === 0) {
    return 50.0; // Neutral baseline
  }

  if (obs.length === 1) {
    return Math.round(Math.max(0, Math.min(100, obs[0].magnitude)) * 100) / 100;
  }

  // Sort chronologically
  const sorted = [...obs].sort((a, b) => {
    const tA = a.capturedAt ? new Date(a.capturedAt).getTime() : 0;
    const tB = b.capturedAt ? new Date(b.capturedAt).getTime() : 0;
    return tA - tB;
  });

  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const delta = latest.magnitude - first.magnitude;

  // Rate of change accelerates or dampens latest magnitude
  const velocityScore = latest.magnitude + delta * 0.5;
  return Math.round(Math.max(0, Math.min(100, velocityScore)) * 100) / 100;
}

/**
 * Constructs the 7 OpportunityComponents by blending deterministic normalizers
 * (Market Momentum, Social Velocity) with Jev's 5 qualitative dimensions.
 */
export function buildOpportunityComponents(params: {
  marketInput: RawMarketDataInput;
  socialInput: RawSocialDataInput;
  jevScores: QualitativeJevScores;
}): OpportunityComponents {
  const marketMomentum = computeMarketMomentum(params.marketInput);
  const socialVelocity = computeSocialVelocity(params.socialInput);

  return {
    marketMomentum,
    socialVelocity,
    narrativeMomentum: Math.round(Math.max(0, Math.min(100, params.jevScores.narrativeMomentum)) * 100) / 100,
    culturalRelevance: Math.round(Math.max(0, Math.min(100, params.jevScores.culturalRelevance)) * 100) / 100,
    memeCompatibility: Math.round(Math.max(0, Math.min(100, params.jevScores.memeCompatibility)) * 100) / 100,
    cryptoAdjacency: Math.round(Math.max(0, Math.min(100, params.jevScores.cryptoAdjacency)) * 100) / 100,
    pairCompatibility: Math.round(Math.max(0, Math.min(100, params.jevScores.pairCompatibility)) * 100) / 100,
  };
}

/**
 * Section 8: Deterministic Opportunity Score arithmetic.
 * The ONLY place the final opportunity score is computed.
 *
 * CRITICAL RULE: Jev NEVER touches the final blended score.
 * It only supplies the 5 qualitative component judgments.
 * Arithmetic is 100% deterministic and auditable.
 */
export function computeOpportunityScore(
  c: OpportunityComponents,
  weights: ScoreWeights,
): number {
  const rawScore =
    c.marketMomentum * weights.marketMomentum +
    c.narrativeMomentum * weights.narrativeMomentum +
    c.socialVelocity * weights.socialVelocity +
    c.culturalRelevance * weights.culturalRelevance +
    c.memeCompatibility * weights.memeCompatibility +
    c.cryptoAdjacency * weights.cryptoAdjacency +
    c.pairCompatibility * weights.pairCompatibility;

  // Clamped to [0, 100], rounded to 2 decimal places to eliminate floating-point drift
  return Math.round(Math.max(0, Math.min(100, rawScore)) * 100) / 100;
}
