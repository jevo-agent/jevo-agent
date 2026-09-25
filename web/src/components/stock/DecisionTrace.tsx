"use client";

import { motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import type { Stock } from "@/types/stock";

interface DecisionTraceProps { asset: Stock; cycle: number; }

const traceLabels = { OBSERVE: "Observe", SIGNAL: "Signal", JEV_DECISION: "JEV", PAIRING: "Pair", LAUNCH: "Launch", MEMORY: "Memory", POLICY: "Policy", ACTION: "Action" } as const;

export function DecisionTrace({ asset, cycle }: DecisionTraceProps) {
  return (
    <section className="border-b border-[var(--jevo-line)]" aria-labelledby="decision-trace-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="decision-trace-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Decision trace</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Observable events only / cycle_{cycle}</p></div>
      <div className="divide-y divide-[var(--jevo-line)]">
        {asset.decisionTrace.map((event, index) => <motion.div key={event.id} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.2, delay: index * 0.03 }} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 px-5 py-5 sm:grid-cols-[96px_minmax(0,1fr)_84px]"><time className="font-mono text-[0.65rem] text-[var(--jevo-dim)]">{formatClock(event.timestamp)}</time><p className="m-0 text-sm leading-6 text-[var(--jevo-text-2)]"><strong className="font-medium text-[var(--jevo-text)]">{event.summary.split(".")[0]}.</strong>{event.summary.includes(".") ? event.summary.slice(event.summary.indexOf(".") + 1) : ""}</p><span className={event.type === "JEV_DECISION" || event.type === "ACTION" ? "font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase"}>{traceLabels[event.type]}</span></motion.div>)}
      </div>
    </section>
  );
}
