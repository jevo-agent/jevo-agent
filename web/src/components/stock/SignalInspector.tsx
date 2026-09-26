"use client";

import { AnimatePresence, motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import { useAgentStore } from "@/store/agent-store";
import type { Stock } from "@/types/stock";

interface SignalInspectorProps { asset: Stock; }

export function SignalInspector({ asset }: SignalInspectorProps) {
  const selectedSignalId = useAgentStore((state) => state.selectedSignalId);
  const selectedSignal = asset.signals.find((signal) => signal.id === selectedSignalId) ?? asset.signals[0];

  if (!selectedSignal) return null;

  return (
    <section className="border-b border-[var(--jevo-line)] lg:min-h-[430px]" aria-labelledby="selected-signal-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="selected-signal-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Selected signal</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Structured inspector</p></div>
      <AnimatePresence mode="wait">
        <motion.div key={selectedSignal.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="p-6">
          <p className="font-mono text-7xl tracking-[-0.11em] text-[var(--jevo-accent)]">{selectedSignal.score}</p><h3 className="mt-4 text-3xl font-medium tracking-[-0.075em] text-[var(--jevo-text)]">{selectedSignal.label}</h3><p className="mt-4 leading-7 text-[var(--jevo-muted)]">{selectedSignal.explanation}</p>
          <dl className="mt-7 border-t border-[var(--jevo-line)] font-mono text-[0.65rem] tracking-[0.07em] uppercase"><InspectorFact label="Delta" value={selectedSignal.deltaLabel} accent /><InspectorFact label="State" value={selectedSignal.state} /><InspectorFact label="Source" value={selectedSignal.source} /><InspectorFact label="Data age" value={selectedSignal.dataAgeSeconds === null ? "—" : `${selectedSignal.dataAgeSeconds}s`} /><InspectorFact label="Evaluated" value={`${formatClock(asset.lastEvaluatedAt)} UTC`} /></dl>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function InspectorFact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex justify-between gap-4 border-b border-[var(--jevo-line)] py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className={accent ? "max-w-45 text-right text-[var(--jevo-accent)]" : "max-w-45 text-right text-[var(--jevo-text)]"}>{value}</dd></div>;
}
