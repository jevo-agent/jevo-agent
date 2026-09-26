/**
 * Fixture route: GET /api/fixture/events
 * Returns empty event list (fixture has no live events).
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [],
    meta: { total: 0, cursor: null },
  });
}
