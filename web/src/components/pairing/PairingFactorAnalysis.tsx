"use client";

import { motion } from "framer-motion";

import { useAgentStore } from "@/store/agent-store";
import type { Pairing } from "@/types/pairing";

interface PairingFactorAnalysisProps { pairing: Pairing; }

export function PairingFactorAnalysis({ pairing }: PairingFactorAnalysisProps) {
  const selectedFactorId = useAgentStore((state) => state.selectedPairingFactorId);
  const setSelectedPairingFactorId = useAgentStore((state) => state.setSelectedPairingFactorId);

  return (
    <section aria-labelledby="pair-factor-analysis-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="pair-factor-analysis-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Pair factor analysis</h2><p className="protocol-label">Select a factor to inspect</p></div>
      <div className="overflow-x-auto"><div role="group" aria-label="Pairing factors" className="min-w-150 divide-y divide-[var(--jevo-line)]">{pairing.factors.map((factor, index) => {
        const selected = factor.id === selectedFactorId;
        return <button key={factor.id} type="button" aria-pressed={selected} onClick={() => setSelectedPairingFactorId(factor.id)} className={selected ? "grid w-full grid-cols-[3rem_minmax(11rem,1fr)_5rem_6rem_minmax(15rem,1.4fr)] items-center gap-4 bg-[var(--jevo-accent-soft)] px-5 py-4 text-left transition-colors sm:px-6" : "grid w-full grid-cols-[3rem_minmax(11rem,1fr)_5rem_6rem_minmax(15rem,1.4fr)] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/3 sm:px-6"}><span className="font-mono text-[0.62rem] text-[var(--jevo-muted)]">{String(index + 1).padStart(2, "0")}</span><span><strong className="block text-sm font-medium text-[var(--jevo-text)]">{factor.label}</strong><span className="mt-1 block font-mono text-[0.58rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{factor.source}</span></span><span className="font-mono text-xl tracking-[-0.06em] text-[var(--jevo-text)]">{factor.score}</span><span className="font-mono text-xs text-[var(--jevo-accent)]">{factor.delta >= 0 ? "+" : ""}{factor.delta.toFixed(1)}</span><span><span className="font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-text)] uppercase">{factor.state}</span><motion.span className="mt-2 block h-px origin-left bg-[var(--jevo-accent)]" initial={false} animate={{ scaleX: factor.score / 100 }} transition={{ duration: 0.35 }} /></span></button>;
      })}</div></div>
    </section>
  );
}
