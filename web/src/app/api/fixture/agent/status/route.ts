/**
 * Fixture route: GET /api/fixture/agent/status
 * Returns AgentRuntime in { data, meta? } envelope from mock-agent-state.
 */
import { NextResponse } from "next/server";
import { mockAgentState } from "@/data/mock-agent-state";

export async function GET() {
  return NextResponse.json({ data: mockAgentState.agent });
}
