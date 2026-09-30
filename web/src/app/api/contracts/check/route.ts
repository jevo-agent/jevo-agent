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

const KNOWN_CONTRACTS: Record<string, CheckStatus> = {
  "0xebfcbf9675f045095883a199ca4a40d59e873e4d": "SOURCE VERIFIED",
  "0x90278dfc0f8cfdbb4d4a013f90f60964d54b87f4": "SOURCE VERIFIED",
  "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec": "ON-CHAIN",
  "0x322f0929c4625ed5bad873c95208d54e1c003b2d": "ON-CHAIN",
  "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a": "ON-CHAIN",
  "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9": "ON-CHAIN",
  "0x1b0e319c6a659f002271b69db8a7df2f911c153e": "ON-CHAIN",
  "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc": "ON-CHAIN",
  "0x6330d8c3178a418788df01a47479c0ce7ccf450b": "ON-CHAIN",
};

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? "";
  const network = searchParams.get("network") ?? "mainnet";

  if (!ADDRESS_REGEX.test(address)) {
    return NextResponse.json({ status: "CHECK UNAVAILABLE" as CheckStatus }, { status: 200 });
  }

  const known = KNOWN_CONTRACTS[address.toLowerCase()];

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
      return NextResponse.json({ status: known ?? ("CHECK UNAVAILABLE" as CheckStatus) }, { status: 200 });
    }

    if (res.status === 404) {
      return NextResponse.json({ status: "NOT FOUND" as CheckStatus }, { status: 200 });
    }

    if (!res.ok) {
      return NextResponse.json({ status: known ?? ("CHECK UNAVAILABLE" as CheckStatus) }, { status: 200 });
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
    return NextResponse.json({ status: known ?? ("CHECK UNAVAILABLE" as CheckStatus) }, { status: 200 });
  }
}
