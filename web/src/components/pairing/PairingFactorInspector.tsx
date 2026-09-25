"use client";

import { AnimatePresence, motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import { useAgentStore } from "@/store/agent-store";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingFactorInspectorProps { pairing: Pairing; stock: Stock; agent: AgentRuntime; }

export function PairingFactorInspector({ pairing, stock, agent }: PairingFactorInspectorProps) {
  const selectedFactorId = useAgentStore((state) => state.selectedPairingFactorId);
  const selectedFactor = pairing.factors.find((factor) => factor.id === selectedFactorId) ?? pairing.factors[0];

  return (
    <section aria-labelledby="factor-inspector-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="factor-inspector-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Factor inspector</h2><p className="protocol-label">Selected evidence</p></div>
      <AnimatePresence mode="wait"><motion.div key={selectedFactor.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="grid lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="protocol-label">{selectedFactor.source}</p><h3 className="mt-3 text-3xl font-medium tracking-[-0.075em]">{selectedFactor.label}</h3></div><p className="font-mono text-5xl tracking-[-0.1em] text-[var(--jevo-accent)]">{selectedFactor.score}</p></div><p className="mt-6 max-w-2xl leading-7 text-[var(--jevo-muted)]">{selectedFactor.explanation}</p></div>
        <dl className="border-t border-[var(--jevo-line)] p-6 font-mono text-[0.63rem] tracking-[0.07em] uppercase lg:border-t-0 lg:border-l"><InspectorLine label="State" value={selectedFactor.state} /><InspectorLine label="Delta" value={`${selectedFactor.delta >= 0 ? "+" : ""}${selectedFactor.delta.toFixed(1)}`} accent /><InspectorLine label="Last evaluated" value={`${formatClock(stock.lastEvaluatedAt)} UTC`} /><InspectorLine label="Freshness" value={agent.dataFreshness} /></dl>
      </motion.div></AnimatePresence>
    </section>
  );
}

function InspectorLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-baseline justify-between gap-4 border-b border-[var(--jevo-line)] py-3 last:border-b-0"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className={accent ? "text-[var(--jevo-accent)]" : "text-right text-[var(--jevo-text)]"}>{value}</dd></div>;
}
