/**
 * Fixture route: GET /api/fixture/opportunities
 * Returns assets array as RankSnapshot-like objects in envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET() {
  const items = mockAgentState.assets.map((asset) => ({
    symbol: asset.symbol,
    currentRank: asset.currentRank,
    previousRank: asset.previousRank,
    opportunityScore: asset.opportunityScore,
    decision: asset.jevDecision,
    recordedAt: asset.lastEvaluatedAt,
  }));

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
