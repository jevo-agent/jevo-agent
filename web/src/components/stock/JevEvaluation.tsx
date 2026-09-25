"use client";

import { motion } from "framer-motion";

import { useAgentStore } from "@/store/agent-store";
import type { Stock } from "@/types/stock";

interface JevEvaluationProps { asset: Stock; }

export function JevEvaluation({ asset }: JevEvaluationProps) {
  const selectedSignalId = useAgentStore((state) => state.selectedSignalId);
  const setSelectedSignalId = useAgentStore((state) => state.setSelectedSignalId);
  const activeId = asset.signals.some((signal) => signal.id === selectedSignalId) ? selectedSignalId : asset.signals[0]?.id;

  return (
    <section className="border-b border-[var(--jevo-line)]" aria-labelledby="evaluation-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="evaluation-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">JEV evaluation</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Select a signal to inspect</p></div>
      <div className="hidden grid-cols-[32px_minmax(0,1.3fr)_minmax(150px,0.9fr)_62px_100px] gap-4 border-b border-[var(--jevo-line)] px-5 py-3 font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase md:grid"><span>#</span><span>Signal</span><span>Score</span><span>Delta</span><span>State</span></div>
      <div>
        {asset.signals.map((signal, index) => {
          const isActive = signal.id === activeId;
          return <button key={signal.id} type="button" onClick={() => setSelectedSignalId(signal.id)} aria-pressed={isActive} className={isActive ? "relative grid w-full grid-cols-[28px_minmax(0,1fr)_36px] items-center gap-4 border-b border-[var(--jevo-line)] bg-[linear-gradient(90deg,rgb(2_198_165_/_5%),transparent_72%)] px-5 py-4 text-left md:grid-cols-[32px_minmax(0,1.3fr)_minmax(150px,0.9fr)_62px_100px]" : "grid w-full grid-cols-[28px_minmax(0,1fr)_36px] items-center gap-4 border-b border-[var(--jevo-line)] px-5 py-4 text-left transition-colors hover:bg-[rgb(255_255_255_/_1.5%)] md:grid-cols-[32px_minmax(0,1.3fr)_minmax(150px,0.9fr)_62px_100px]"}>
            {isActive && <motion.span layoutId="active-signal-row" className="absolute top-3 bottom-3 left-0 w-0.5 bg-[var(--jevo-accent)]" transition={{ duration: 0.18 }} />}
            <span className="font-mono text-[0.65rem] text-[var(--jevo-dim)]">{String(index + 1).padStart(2, "0")}</span>
            <span className="min-w-0"><strong className="block text-sm font-medium text-[var(--jevo-text)]">{signal.label}</strong><span className="mt-1 block truncate font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{signal.context} / data age {signal.dataAgeSeconds}s</span></span>
            <span className="hidden items-center gap-3 md:flex"><span className="h-1 flex-1 bg-[rgb(220_235_215_/_8%)]"><motion.span className={isActive ? "block h-full bg-[var(--jevo-accent)]" : "block h-full bg-[var(--jevo-dim)]"} initial={{ width: 0 }} animate={{ width: `${signal.score}%` }} transition={{ duration: 0.35 }} /></span><span className="font-mono text-xs text-[var(--jevo-text)]">{signal.score}</span></span>
            <span className="hidden font-mono text-xs text-[var(--jevo-accent)] md:block">{signal.deltaLabel}</span><span className="hidden font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase md:block">{signal.state}</span><span className="font-mono text-sm text-[var(--jevo-accent)] md:hidden">{signal.score}</span>
          </button>;
        })}
      </div>
    </section>
  );
}
