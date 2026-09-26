/**
 * Fixture route: GET /api/fixture/launches
 * Returns the active launch cycle in envelope format.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET() {
  const launch = mockAgentState.launch;
  const items = [
    {
      id: launch.cycleId,
      pairingCandidateId: launch.selectedPairingSlug,
      stage: launch.stage,
      readiness: launch.readiness,
      checksPassed: launch.policyChecks.filter((c) => c.status === "PASSED").length,
      checksTotal: launch.policyChecks.length,
      stageDeadlineAt: new Date(Date.now() + launch.countdownSeconds * 1000).toISOString(),
      transactionStatus: launch.transactionState,
    },
  ];

  return NextResponse.json({
    data: items,
    meta: { total: items.length },
  });
}
