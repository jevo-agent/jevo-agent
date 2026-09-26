/**
 * Fixture route: GET /api/fixture/launches/[id]
 * Returns a single launch candidate by cycleId.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const launch = mockAgentState.launch;

  if (id !== launch.cycleId) {
    return NextResponse.json({ error: `Launch ${id} not found` }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: launch.cycleId,
      pairingCandidateId: launch.selectedPairingSlug,
      stage: launch.stage,
      readiness: launch.readiness,
      checksPassed: launch.policyChecks.filter((c) => c.status === "PASSED").length,
      checksTotal: launch.policyChecks.length,
      stageDeadlineAt: new Date(Date.now() + launch.countdownSeconds * 1000).toISOString(),
      transactionStatus: launch.transactionState,
    },
  });
}
