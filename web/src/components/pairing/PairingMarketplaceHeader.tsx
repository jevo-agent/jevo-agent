import Link from "next/link";

import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";

interface PairingMarketplaceHeaderProps {
  agent: AgentRuntime;
  pairings: Pairing[];
}

export function PairingMarketplaceHeader({ agent, pairings }: PairingMarketplaceHeaderProps) {
  const counts = {
    proposed: pairings.filter((pairing) => pairing.status === "AGENT_PROPOSED").length,
    highConviction: pairings.filter((pairing) => pairing.pairScore >= 90).length,
    curated: pairings.filter((pairing) => pairing.status === "CURATED").length,
    launchCandidates: pairings.filter((pairing) => pairing.status === "LAUNCH_CANDIDATE").length,
  };

  return (
    <>
      <header className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_78%)]">
        <div className="protocol-shell flex min-h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Back to JEVO Home"><span className="grid size-6 place-items-center border border-[var(--jevo-line-strong)]" aria-hidden="true"><span className="size-1.5 bg-[var(--jevo-accent)]" /></span><span className="font-mono text-sm font-medium tracking-[0.16em] text-[var(--jevo-text)]">JEVO</span></Link>
          <nav className="hidden items-center gap-2 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase sm:flex" aria-label="Breadcrumb"><Link href="/" className="transition-colors hover:text-[var(--jevo-text)]">Agent</Link><span>/</span><strong className="font-medium text-[var(--jevo-text)]">Pairing Marketplace</strong></nav>
          <p className="font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase"><span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />JEV <span className="text-[var(--jevo-accent)]">{agent.jevStatus}</span> <span className="hidden lg:inline">/ Cycle {agent.activeCycle ?? "UNAVAILABLE"}</span></p>
        </div>
      </header>
      <section className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_72%)]" aria-labelledby="marketplace-title">
        <div className="protocol-shell grid lg:grid-cols-[1.4fr_repeat(4,minmax(0,0.65fr))]">
          <div className="border-b border-[var(--jevo-line)] py-8 lg:border-r lg:border-b-0 lg:pr-8"><p className="protocol-label">Stock × Meme Market</p><h1 id="marketplace-title" className="mt-4 text-5xl font-medium tracking-[-0.09em] text-[var(--jevo-text)] sm:text-6xl">Pairing Marketplace</h1><p className="mt-4 max-w-xl leading-7 text-[var(--jevo-muted)]">JEVO converts qualified stock opportunities into meme concepts with independent narrative theses. Rankings do not automatically become pairings.</p></div>
          <MarketStat label="Active proposals" value={counts.proposed.toString()} accent /><MarketStat label="High-conviction" value={counts.highConviction.toString()} /><MarketStat label="Curated" value={counts.curated.toString()} /><MarketStat label="Launch candidates" value={counts.launchCandidates.toString()} accent />
        </div>
      </section>
    </>
  );
}

function MarketStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex flex-col justify-center border-b border-[var(--jevo-line)] py-5 lg:border-r lg:border-b-0 lg:px-5 last:border-r-0"><p className="protocol-label">{label}</p><p className={accent ? "mt-2 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-accent)]" : "mt-2 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]"}>{value.padStart(2, "0")}</p></div>;
}
