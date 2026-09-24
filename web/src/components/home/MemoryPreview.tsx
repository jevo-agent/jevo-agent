import Link from "next/link";

import { SectionHeading } from "@/components/home/AgentTerminal";
import type { MemoryRecord } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface MemoryPreviewProps { asset: Stock; memory: MemoryRecord[]; }

export function MemoryPreview({ asset, memory }: MemoryPreviewProps) {
  const relevantMemory = memory.filter((record) => record.subject.includes(asset.symbol)).slice(0, 2);

  return (
    <section id="memory" className="scroll-mt-6 py-20 sm:py-28" aria-labelledby="memory-title">
      <div className="protocol-shell">
        <SectionHeading id="memory-title" index="06 / Agent memory" title="JEVO remembers what changed." meta="Rank history / decision cycles\nStateful by design" />
        <div className="mt-10 border-y border-[var(--jevo-line)]">
          <div className="grid divide-y divide-[var(--jevo-line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {asset.rankHistory.map((entry) => <div key={entry.timestamp} className="p-5"><p className="protocol-label">{entry.timestamp.slice(11, 16)} UTC</p><p className={entry.rank === asset.currentRank ? "mt-3 text-5xl tracking-[-0.09em] text-[var(--jevo-accent)]" : "mt-3 text-5xl tracking-[-0.09em] text-[var(--jevo-text)]"}>#{String(entry.rank).padStart(2, "0")}</p><p className="mt-1 font-mono text-xs text-[var(--jevo-muted)]">{asset.scoreHistory.find((point) => point.timestamp === entry.timestamp)?.score ?? "—"}</p></div>)}
          </div>
          <div className="grid gap-6 border-t border-[var(--jevo-line)] p-6 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-start"><p className="protocol-label">Memory chain</p><p className="text-xl leading-8 tracking-[-0.04em] text-[#b7beb0]">Previous state → observable signal change → JEV decision → current state. Each cycle retains structured evidence, rather than resetting the agent to a one-shot query.</p><Link href="/memory" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-accent)] uppercase">Open memory ↗</Link></div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {relevantMemory.map((record) => <article key={record.id} className="border border-[var(--jevo-line)] p-5"><p className="protocol-label">{record.id} / cycle {record.cycleId}</p><h3 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[var(--jevo-text)]">{record.summary}</h3><div className="mt-5 grid gap-3 border-t border-[var(--jevo-line)] pt-4 font-mono text-[0.625rem] tracking-[0.07em] uppercase sm:grid-cols-2"><p className="text-[var(--jevo-muted)]">Previous <span className="mt-1 block text-[var(--jevo-text)]">{record.previousState}</span></p><p className="text-[var(--jevo-muted)]">Current <span className="mt-1 block text-[var(--jevo-accent)]">{record.currentState}</span></p></div></article>)}
        </div>
      </div>
    </section>
  );
}
