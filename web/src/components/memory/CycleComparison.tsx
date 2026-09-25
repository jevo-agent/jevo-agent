"use client";

import { motion } from "framer-motion";

import type { MemoryComparison } from "@/types/agent";

interface CycleComparisonProps { comparison: MemoryComparison; }

export function CycleComparison({ comparison }: CycleComparisonProps) {
  return <section aria-labelledby="cycle-comparison-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="cycle-comparison-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">State comparison</h2><p className="protocol-label">Cycle {comparison.previousCycle} → cycle {comparison.currentCycle}</p></div><div className="grid lg:grid-cols-2"><ComparisonPanel label={`Previous state / ${comparison.previousCycle}`} title="Before the change" entries={comparison.entries} mode="previous" /><ComparisonPanel label={`Current state / ${comparison.currentCycle}`} title="After JEV re-evaluated" entries={comparison.entries} mode="current" /></div></section>;
}

function ComparisonPanel({ label, title, entries, mode }: { label: string; title: string; entries: MemoryComparison["entries"]; mode: "previous" | "current" }) { return <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.2 }} className="border-b border-[var(--jevo-line)] p-6 last:border-b-0 lg:border-r lg:last:border-r-0 lg:border-b-0"><p className="protocol-label">{label}</p><h3 className="mt-4 text-2xl font-medium tracking-[-0.06em]">{title}</h3><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.62rem] tracking-[0.07em] uppercase">{entries.map((entry) => <div key={entry.label} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{entry.label}</dt><dd className="text-[var(--jevo-text)]">{mode === "previous" ? entry.previous : entry.current}</dd><span className={mode === "current" ? "text-[var(--jevo-accent)]" : "text-[var(--jevo-muted)]"}>{mode === "current" ? entry.delta : "—"}</span></div>)}</dl></motion.div>; }
