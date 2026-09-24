import type { AgentRuntime } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface DecisionSummaryProps {
  asset: Stock;
  agent: AgentRuntime;
}

export function DecisionSummary({ asset, agent }: DecisionSummaryProps) {
  return (
    <section className="border-b border-[var(--jevo-line)]" aria-labelledby="decision-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="decision-summary-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Decision summary</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Current state / cycle_{agent.activeCycle}</p></div>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-[var(--jevo-line)] p-6 lg:border-r lg:border-b-0">
          <p className="protocol-label"><span className="mr-2 inline-block size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />JEV decision published</p>
          <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2"><strong className="text-5xl font-medium tracking-[-0.1em] text-[var(--jevo-accent)]">{asset.jevDecision}</strong><span className="mb-1 font-mono text-lg text-[var(--jevo-text)]">#{String(asset.previousRank).padStart(2, "0")} → #{String(asset.currentRank).padStart(2, "0")}</span></div>
          <p className="mt-6 max-w-lg leading-7 text-[var(--jevo-muted)]">JEVO detected accelerating AI infrastructure discussion alongside elevated retail attention, persistent cultural relevance, and stronger crypto-native pairing evidence. This is a structured state change, not an investment prediction.</p>
        </div>
        <div className="flex flex-col justify-between p-6"><div><p className="protocol-label">Why now?</p><h3 className="mt-4 text-4xl font-medium leading-[0.92] tracking-[-0.08em] text-[var(--jevo-text)]">AI infrastructure shifted from <span className="text-[var(--jevo-muted)]">strong</span> to <span className="text-[var(--jevo-accent)]">accelerating.</span></h3><p className="mt-5 max-w-xl leading-7 text-[var(--jevo-muted)]">Narrative pressure increased faster than competing assets while GPU, AI-agent, and crypto narrative overlap kept pairing evidence high enough to move {asset.symbol} above its prior state.</p></div><dl className="mt-8 grid grid-cols-3 border-t border-[var(--jevo-line)] pt-4"><SummaryFact label="Decision" value={asset.jevDecision} /><SummaryFact label="Confidence" value={`${asset.confidence}%`} /><SummaryFact label="Cycle" value={agent.activeCycle.toString()} /></dl></div>
      </div>
    </section>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return <div><dt className="protocol-label">{label}</dt><dd className="mt-2 font-mono text-sm text-[var(--jevo-text)]">{value}</dd></div>;
}
