/**
 * POST /api/admin/launches/schedule
 * Proxies to worker POST /api/v1/admin/launches/schedule
 * Body: { pairingCandidateId: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await proxyAdminPost("/launches/schedule", body);
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
