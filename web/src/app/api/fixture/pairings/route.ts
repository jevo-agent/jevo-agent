/**
 * Fixture route: GET /api/fixture/pairings
 * Returns all pairings from mock state in backend envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET() {
  const items = mockAgentState.pairings.map((p) => ({
    id: p.slug,
    symbol: p.stockSymbol,
    memeSymbol: p.symbol,
    thesis: p.thesis,
    components: p.factors.map((f) => ({ label: f.label, score: f.score })),
    pairingScore: p.pairScore,
    lifecycleState: p.status,
    createdAt: p.history[0]?.timestamp ?? new Date().toISOString(),
  }));

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
