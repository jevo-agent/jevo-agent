import type { Stock } from "@/types/stock";

interface AgentMemoryProps { asset: Stock; }

export function AgentMemory({ asset }: AgentMemoryProps) {
  return (
    <section aria-labelledby="agent-memory-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="agent-memory-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Agent memory</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Historical movement / last 8h</p></div>
      <div className="grid lg:grid-cols-2">
        <article className="border-b border-[var(--jevo-line)] p-6 lg:border-r lg:border-b-0"><p className="protocol-label">Rank history</p><div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">{asset.rankHistory.map((entry, index) => <div key={entry.timestamp} className="flex items-center gap-3"><span className={entry.rank === asset.currentRank ? "border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-3 py-2 font-mono text-lg text-[#080a07]" : "border border-[var(--jevo-line-strong)] px-3 py-2 font-mono text-lg text-[var(--jevo-text)]"}>#{String(entry.rank).padStart(2, "0")}</span>{index < asset.rankHistory.length - 1 && <span className="text-[var(--jevo-muted)]" aria-hidden="true">→</span>}</div>)}</div><p className="mt-7 max-w-md text-sm leading-6 text-[var(--jevo-muted)]">JEVO retains each movement as prior state → observed change → current state, so the current rank is never presented without context.</p></article>
        <article className="p-6"><p className="protocol-label">Opportunity score history</p><div className="mt-6 space-y-4">{asset.scoreHistory.map((point, index) => <div key={point.timestamp} className="grid grid-cols-[52px_minmax(0,1fr)_38px] items-center gap-3 font-mono text-xs"><span className="text-[var(--jevo-muted)]">{index === asset.scoreHistory.length - 1 ? "NOW" : point.timestamp.slice(11, 16)}</span><span className="h-1 bg-[rgb(240_242_233_/_8%)]"><span className={index === asset.scoreHistory.length - 1 ? "block h-full bg-[var(--jevo-accent)]" : "block h-full bg-[#788174]"} style={{ width: `${point.score}%` }} /></span><span className={index === asset.scoreHistory.length - 1 ? "text-right text-[var(--jevo-accent)]" : "text-right text-[var(--jevo-text)]"}>{point.score}</span></div>)}</div></article>
      </div>
    </section>
  );
}
