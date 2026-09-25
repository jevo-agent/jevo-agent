"use client";

import { motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";

interface PairingHistoryProps { pairing: Pairing; agent: AgentRuntime; }

export function PairingHistory({ pairing, agent }: PairingHistoryProps) {
  return (
    <section aria-labelledby="pairing-history-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="pairing-history-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Pairing history</h2><p className="protocol-label">Published cycle / {agent.activeCycle}</p></div>
      <ol className="divide-y divide-[var(--jevo-line)]">{pairing.history.map((event, index) => <motion.li key={`${event.timestamp}-${event.state}`} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.2, delay: index * 0.03 }} className="grid gap-3 px-5 py-5 sm:grid-cols-[8rem_9rem_minmax(0,1fr)] sm:px-6"><time dateTime={event.timestamp} className="font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-muted)]">{formatClock(event.timestamp)} UTC</time><span className="font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase">{event.state.replaceAll("_", " ")}</span><p className="text-sm leading-6 text-[var(--jevo-muted)]">{event.summary}</p></motion.li>)}</ol>
    </section>
  );
}
