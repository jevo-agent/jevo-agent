import Link from "next/link";

import { formatClock } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface LaunchHeaderProps { launch: Launch; pairing: Pairing; stock: Stock; agent: AgentRuntime; }

export function LaunchHeader({ launch, pairing, stock, agent }: LaunchHeaderProps) {
  const passedChecks = launch.policyChecks.filter((check) => check.status === "PASSED").length;

  return (
    <header className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_72%)]">
      <div className="protocol-shell">
        <nav aria-label="Breadcrumb" className="flex min-h-12 items-center gap-2 border-b border-[var(--jevo-line)] font-mono text-[0.62rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase"><Link href="/" className="transition-colors hover:text-[var(--jevo-accent)]">JEVO</Link><span aria-hidden="true">/</span><Link href={`/pairing/${pairing.slug}`} className="transition-colors hover:text-[var(--jevo-accent)]">{pairing.stockSymbol} × {pairing.symbol}</Link><span aria-hidden="true">/</span><span className="text-[var(--jevo-text)]">Autonomous launch</span></nav>
        <div className="grid border-x border-[var(--jevo-line)] md:grid-cols-[minmax(0,1.45fr)_repeat(5,minmax(0,.55fr))]">
          <div className="flex min-h-44 flex-col justify-center border-b border-[var(--jevo-line)] p-5 md:border-r md:border-b-0 md:p-7"><p className="protocol-label">JEV autonomous decision</p><h1 className="mt-4 text-5xl font-medium leading-none tracking-[-0.1em] sm:text-6xl">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></h1><div className="mt-5 flex flex-wrap gap-3 font-mono text-[0.62rem] tracking-[0.08em] uppercase"><span className="border border-[rgb(2_198_165_/_30%)] bg-[var(--jevo-accent-soft)] px-2 py-1 text-[var(--jevo-accent)]">Policy controlled</span><Link href={`/stock/${stock.symbol}`} className="text-[var(--jevo-muted)] transition-colors hover:text-[var(--jevo-accent)]">{stock.name} ↗</Link><Link href="/memory" className="text-[var(--jevo-muted)] transition-colors hover:text-[var(--jevo-accent)]">Memory ↗</Link><span className="text-[var(--jevo-muted)]">Cycle {launch.cycleId} · {launch.stage.replaceAll("_", " ")}</span></div></div>
          <LaunchMetric label="Opportunity" value={stock.opportunityScore.toFixed(1)} accent />
          <LaunchMetric label="Pair score" value={pairing.pairScore.toFixed(1)} />
          <LaunchMetric label="Readiness" value={launch.readiness} accent />
          <LaunchMetric label="Policy checks" value={`${passedChecks} / ${launch.policyChecks.length}`} />
          <LaunchMetric label="Network" value={agent.networkLabel ?? "UNAVAILABLE"} meta={`Eval ${formatClock(stock.lastEvaluatedAt)} UTC · ${agent.dataFreshness}`} />
        </div>
      </div>
    </header>
  );
}

function LaunchMetric({ label, value, meta, accent = false }: { label: string; value: string; meta?: string; accent?: boolean }) {
  return <div className="flex min-h-28 flex-col justify-center border-b border-[var(--jevo-line)] p-4 last:border-b-0 md:min-h-44 md:border-r md:border-b-0"><p className="protocol-label">{label}</p><strong className={accent ? "mt-3 font-mono text-xl font-medium tracking-[-0.07em] text-[var(--jevo-accent)]" : "mt-3 font-mono text-base font-medium leading-5 tracking-[-0.04em] text-[var(--jevo-text)]"}>{value}</strong>{meta ? <span className="mt-2 font-mono text-[0.55rem] leading-4 tracking-[0.04em] text-[var(--jevo-muted)] uppercase">{meta}</span> : null}</div>;
}
