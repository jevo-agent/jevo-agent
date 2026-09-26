/**
 * Fixture route: GET /api/fixture/memory
 * Returns memory records in envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET() {
  const items = mockAgentState.memory.map((m) => ({
    id: m.id,
    subjectType: "ASSET",
    subjectId: m.subject,
    cycleId: String(m.cycleId),
    previousState: { label: m.previousState },
    observedChange: m.summary,
    decision: m.decision,
    currentState: { label: m.currentState },
    evidenceRefs: m.structuredEvidence.map((e) => e.label),
    recordedAt: m.timestamp,
  }));

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
