/**
 * POST /api/admin/agent/resume
 * Proxies to worker POST /api/v1/admin/agent/resume
 */
import { NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

export async function POST() {
  try {
    const upstream = await proxyAdminPost("/agent/resume");
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
