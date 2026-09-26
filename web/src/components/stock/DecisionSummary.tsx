import type { AgentRuntime } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface DecisionSummaryProps {
  asset: Stock;
  agent: AgentRuntime;
}

export function DecisionSummary({ asset, agent }: DecisionSummaryProps) {
  return (
    <section className="border-b border-[var(--jevo-line)]" aria-labelledby="decision-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="decision-summary-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Decision summary</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Current state / cycle_{agent.activeCycle ?? "UNAVAILABLE"}</p></div>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-[var(--jevo-line)] p-6 lg:border-r lg:border-b-0">
          <p className="protocol-label"><span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />JEV decision published</p>
          <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2"><strong className="text-5xl font-medium tracking-[-0.1em] text-[var(--jevo-accent)]">{asset.jevDecision}</strong><span className="mb-1 font-mono text-lg text-[var(--jevo-text)]">{asset.previousRank === null ? "—" : `#${String(asset.previousRank).padStart(2, "0")} →`} #{String(asset.currentRank).padStart(2, "0")}</span></div>
          <p className="mt-6 max-w-lg leading-7 text-[var(--jevo-muted)]">The worker published this structured state change from the persisted opportunity score and signal dimensions. It is an auditable system state, not an investment prediction.</p>
        </div>
        <div className="flex flex-col justify-between p-6"><div><p className="protocol-label">Structured evidence</p><h3 className="mt-4 text-4xl font-medium leading-[0.92] tracking-[-0.08em] text-[var(--jevo-text)]">{asset.symbol} moved from <span className="text-[var(--jevo-muted)]">{asset.previousRank === null ? "UNAVAILABLE" : `#${String(asset.previousRank).padStart(2, "0")}`}</span> to <span className="text-[var(--jevo-accent)]">#{String(asset.currentRank).padStart(2, "0")}.</span></h3><p className="mt-5 max-w-xl leading-7 text-[var(--jevo-muted)]">Persisted worker dimensions and observable state transitions are shown below. No private model reasoning is exposed.</p></div><dl className="mt-8 grid grid-cols-3 border-t border-[var(--jevo-line)] pt-4"><SummaryFact label="Decision" value={asset.jevDecision} /><SummaryFact label="Confidence" value={asset.confidence === null ? "—" : `${asset.confidence}%`} /><SummaryFact label="Cycle" value={agent.activeCycle === null ? "UNAVAILABLE" : String(agent.activeCycle)} /></dl></div>
      </div>
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return <div><dt className="protocol-label">{label}</dt><dd className="mt-2 font-mono text-sm text-[var(--jevo-text)]">{value}</dd></div>;
}
