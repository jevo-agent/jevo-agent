/**
 * POST /api/admin/pairings/[id]/reject
 * Proxies to worker POST /api/v1/admin/pairings/:id/reject
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const upstream = await proxyAdminPost(`/pairings/${encodeURIComponent(id)}/reject`);
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
