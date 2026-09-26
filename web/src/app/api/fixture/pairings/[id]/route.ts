/**
 * Fixture route: GET /api/fixture/pairings/[id]
 * Returns a single pairing by slug.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const slug = id.trim().toLowerCase();
  const pairing = mockAgentState.pairings.find((p) => p.slug === slug);

  if (!pairing) {
    return NextResponse.json({ error: `Pairing ${slug} not found` }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: pairing.slug,
      symbol: pairing.stockSymbol,
      memeSymbol: pairing.symbol,
      thesis: pairing.thesis,
      components: pairing.factors.map((f) => ({ label: f.label, score: f.score })),
      pairingScore: pairing.pairScore,
      lifecycleState: pairing.status,
      createdAt: pairing.history[0]?.timestamp ?? new Date().toISOString(),
      alternates: mockAgentState.pairings
        .filter((p) => p.slug !== slug && p.stockSymbol === pairing.stockSymbol)
        .map((p) => ({
          id: p.slug,
          symbol: p.stockSymbol,
          memeSymbol: p.symbol,
          pairingScore: p.pairScore,
          lifecycleState: p.status,
          createdAt: p.history[0]?.timestamp ?? new Date().toISOString(),
        })),
    },
  });
}
