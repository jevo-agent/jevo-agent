/**
 * POST /api/admin/config/weights
 * Proxies to worker POST /api/v1/admin/config/weights
 * Body: { marketMomentum, narrativeMomentum, socialVelocity, ... } (must sum to 1.0)
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await proxyAdminPost("/config/weights", body);
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
