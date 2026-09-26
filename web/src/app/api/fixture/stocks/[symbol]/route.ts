/**
 * Fixture route: GET /api/fixture/stocks/[symbol]
 * Returns a single stock asset in envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

interface Params {
  params: Promise<{ symbol: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { symbol } = await params;
  const normalizedSymbol = symbol.trim().toUpperCase();
  const asset = mockAgentState.assets.find((a) => a.symbol === normalizedSymbol);

  if (!asset) {
    return NextResponse.json(
      { error: `Stock asset ${normalizedSymbol} not found` },
      { status: 404 },
    );
  }

  const pairings = mockAgentState.pairings.filter((p) => p.stockSymbol === asset.symbol);

  return NextResponse.json({
    data: {
      asset: {
        symbol: asset.symbol,
        name: asset.name,
        active: true,
      },
      current: {
        rank: asset.currentRank,
        previousRank: asset.previousRank,
        score: {
          symbol: asset.symbol,
          score: asset.opportunityScore,
        },
        decision: {
          symbol: asset.symbol,
          decision: asset.jevDecision,
          confidence: asset.confidence,
        },
      },
      rankHistory: asset.rankHistory.map((rh) => ({
        symbol: asset.symbol,
        currentRank: rh.rank,
        previousRank: rh.rank,
        opportunityScore: asset.opportunityScore,
        recordedAt: rh.timestamp,
      })),
      scoreHistory: asset.scoreHistory.map((sh) => ({
        symbol: asset.symbol,
        score: sh.score,
        recordedAt: sh.timestamp,
      })),
      recentEvents: asset.decisionTrace.map((dt) => ({
        id: dt.id,
        subjectId: asset.symbol,
        decision: dt.type,
        observedChange: dt.summary,
        recordedAt: dt.timestamp,
      })),
      openPairings: pairings.map((p) => ({
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
