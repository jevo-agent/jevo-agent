/**
 * Fixture route: GET /api/fixture/opportunities
 * Returns assets array as RankSnapshot-like objects in envelope format,
 * enriched with full OpportunityScoreDetail (matching real worker API).
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

function signalScore(asset: (typeof mockAgentState.assets)[number], label: string) {
  return asset.signals.find((signal) => signal.label.toLowerCase() === label.toLowerCase())?.score ?? asset.opportunityScore;
}

export async function GET() {
  const items = mockAgentState.assets.map((asset) => {
    const detail = {
      marketMomentum: signalScore(asset, "Market Momentum"),
      narrativeMomentum: signalScore(asset, "Narrative Momentum"),
      socialVelocity: signalScore(asset, "Social Velocity"),
      culturalRelevance: signalScore(asset, "Cultural Relevance"),
      memeCompatibility: signalScore(asset, "Meme Compatibility"),
      cryptoAdjacency: signalScore(asset, "Crypto Adjacency"),
      pairCompatibility: signalScore(asset, "Pair Compatibility"),
    };

    return {
      cycleId: `cycle-${mockAgentState.agent.activeCycle}`,
      symbol: asset.symbol,
      currentRank: asset.currentRank,
      previousRank: asset.previousRank,
      opportunityScore: asset.opportunityScore,
      decision: asset.jevDecision,
      recordedAt: asset.lastEvaluatedAt,
      score: {
        symbol: asset.symbol,
        cycleId: `cycle-${mockAgentState.agent.activeCycle}`,
        ...detail,
        score: asset.opportunityScore,
      },
    };
  });

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
