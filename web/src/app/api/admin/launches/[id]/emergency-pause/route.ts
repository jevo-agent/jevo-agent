/**
 * POST /api/admin/launches/[id]/emergency-pause
 * Proxies to worker POST /api/v1/admin/launches/:id/emergency-pause
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const upstream = await proxyAdminPost(`/launches/${encodeURIComponent(id)}/emergency-pause`);
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
