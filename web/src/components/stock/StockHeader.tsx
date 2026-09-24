import Link from "next/link";

import { formatClock } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface StockHeaderProps {
  asset: Stock;
  agent: AgentRuntime;
}

export function StockHeader({ asset, agent }: StockHeaderProps) {
  const isRising = asset.rankMovement > 0;
  const status = isRising ? "RISING" : asset.rankMovement < 0 ? "FALLING" : "STABLE";

  return (
    <>
      <header className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_78%)]">
        <div className="protocol-shell flex min-h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Back to JEVO Home">
            <span className="grid size-6 place-items-center border border-[var(--jevo-line-strong)]" aria-hidden="true"><span className="size-1.5 bg-[var(--jevo-accent)]" /></span>
            <span className="font-mono text-sm font-medium tracking-[0.16em] text-[var(--jevo-text)]">JEVO</span>
          </Link>
          <nav className="hidden items-center gap-2 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase sm:flex" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-[var(--jevo-text)]">Agent</Link><span>/</span><span>Stock intelligence</span><span>/</span><strong className="font-medium text-[var(--jevo-text)]">{asset.symbol}</strong>
          </nav>
          <p className="font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase"><span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />JEV <span className="text-[var(--jevo-accent)]">{agent.jevStatus}</span></p>
        </div>
      </header>

      <section className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_72%)]" aria-labelledby="stock-title">
        <div className="protocol-shell grid lg:grid-cols-[1.3fr_repeat(6,minmax(0,0.7fr))]">
          <div className="border-b border-[var(--jevo-line)] py-7 lg:border-r lg:border-b-0 lg:pr-8">
            <h1 id="stock-title" className="text-6xl font-medium tracking-[-0.1em] text-[var(--jevo-text)] sm:text-7xl">{asset.symbol}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-sm text-[var(--jevo-muted)]">{asset.name}</p><span className="border border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] px-2 py-1 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase">Rank #{String(asset.currentRank).padStart(2, "0")} / {status}</span></div>
          </div>
          <HeaderStat label="Opportunity" value={asset.opportunityScore.toString()} accent />
          <HeaderStat label="Previous rank" value={`#${String(asset.previousRank).padStart(2, "0")}`} />
          <HeaderStat label="Rank movement" value={`${isRising ? "▲" : asset.rankMovement < 0 ? "▼" : "—"} ${asset.rankMovement > 0 ? "+" : ""}${asset.rankMovement}`} accent={isRising} />
          <HeaderStat label="JEV decision" value={asset.jevDecision.replace("_", " ")} accent />
          <HeaderStat label="Confidence" value={`${asset.confidence}%`} />
          <div className="flex flex-col justify-center border-t border-[var(--jevo-line)] py-5 lg:border-t-0 lg:border-l lg:pl-6"><p className="protocol-label">Last evaluated</p><p className="mt-2 font-mono text-sm text-[var(--jevo-text)]">{formatClock(asset.lastEvaluatedAt)} UTC</p><p className="mt-2 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">Freshness / {agent.dataFreshness}<br />cycle_{agent.activeCycle}</p></div>
        </div>
      </section>
    </>
  );
}

function HeaderStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex flex-col justify-center border-b border-[var(--jevo-line)] py-5 lg:border-r lg:border-b-0 lg:px-5"><p className="protocol-label">{label}</p><p className={accent ? "mt-2 font-mono text-xl tracking-[-0.06em] text-[var(--jevo-accent)]" : "mt-2 font-mono text-xl tracking-[-0.06em] text-[var(--jevo-text)]"}>{value}</p></div>;
}
