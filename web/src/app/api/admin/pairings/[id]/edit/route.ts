/**
 * POST /api/admin/pairings/[id]/edit
 * Proxies to worker POST /api/v1/admin/pairings/:id/edit
 * Body: { memeSymbol?: string, thesis?: { whyStock?, whyMeme?, whyPair?, whyNow? } }
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyAdminPost } from "@/lib/api/admin-proxy";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const upstream = await proxyAdminPost(`/pairings/${encodeURIComponent(id)}/edit`, body);
    const json = await upstream.json().catch(() => ({}));
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err) },
      { status: 502 },
    );
  }
}
