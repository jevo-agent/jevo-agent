import { NextResponse } from "next/server";

/**
 * GET /api/contracts/check?address=0x...&network=mainnet|testnet
 *
 * Proxies a check to the Blockscout explorer API for the given address.
 * Returns: { status: "ON-CHAIN" | "SOURCE VERIFIED" | "NOT FOUND" | "CHECK UNAVAILABLE" }
 *
 * Rules:
 * - Never throws: always returns a valid JSON response.
 * - Timeout: 4 seconds.
 * - Cache: 5 minutes (Next.js route segment config).
 * - Bot-detection fallback: if response is HTML or unexpected, returns CHECK UNAVAILABLE.
 */

export const dynamic = "force-dynamic";
// Cache at the CDN/Next edge for 5 minutes
export const revalidate = 300;

const EXPLORER_API: Record<string, string> = {
  mainnet: "https://robinhoodchain.blockscout.com",
  testnet: "https://explorer.testnet.chain.robinhood.com",
};

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

type CheckStatus = "ON-CHAIN" | "SOURCE VERIFIED" | "NOT FOUND" | "CHECK UNAVAILABLE";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? "";
  const network = searchParams.get("network") ?? "mainnet";

  if (!ADDRESS_REGEX.test(address)) {
    return NextResponse.json({ status: "CHECK UNAVAILABLE" as CheckStatus }, { status: 200 });
  }

  const base = EXPLORER_API[network] ?? EXPLORER_API.mainnet;
  const apiUrl = `${base}/api/v2/addresses/${address}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JEVO-ContractCheck/1.0; +https://jevo.finance)",
        Accept: "application/json",
      },
      // Next.js fetch cache: revalidate every 5 minutes
      next: { revalidate: 300 },
    });

    clearTimeout(timeoutId);

    // Cloudflare bot challenge or HTML response → unavailable
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
      return NextResponse.json({ status: "CHECK UNAVAILABLE" as CheckStatus }, { status: 200 });
    }

    if (res.status === 404) {
      return NextResponse.json({ status: "NOT FOUND" as CheckStatus }, { status: 200 });
    }

    if (!res.ok) {
      return NextResponse.json({ status: "CHECK UNAVAILABLE" as CheckStatus }, { status: 200 });
    }

    const data = (await res.json()) as Record<string, unknown>;

    // is_contract=false means it's an EOA, not a contract
    if (data.is_contract !== true) {
      return NextResponse.json({ status: "NOT FOUND" as CheckStatus }, { status: 200 });
    }

    const status: CheckStatus = data.is_verified === true ? "SOURCE VERIFIED" : "ON-CHAIN";
    return NextResponse.json({ status }, { status: 200 });
  } catch {
    // AbortError (timeout) or network error
    return NextResponse.json({ status: "CHECK UNAVAILABLE" as CheckStatus }, { status: 200 });
  }
}
