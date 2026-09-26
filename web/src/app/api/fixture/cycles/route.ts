/**
 * Fixture route: GET /api/fixture/cycles
 * Returns agent cycles in envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 10)));

  const items = mockAgentState.agentCycles.slice(0, limit).map((c) => ({
    id: `cycle-${c.id}`,
    kind: "FULL",
    startedAt: c.timestamp,
    completedAt: c.status === "COMPLETE" ? c.timestamp : null,
    assetsScanned: c.assetsEvaluated,
    signalsProcessed: c.decisions,
    status: c.status === "ACTIVE" ? "RUNNING" : "COMPLETED",
  }));

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
