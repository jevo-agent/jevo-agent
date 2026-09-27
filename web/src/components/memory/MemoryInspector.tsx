"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import { useAgentStore } from "@/store/agent-store";
import type { MemoryRecord } from "@/types/agent";

interface MemoryInspectorProps { memory: MemoryRecord[]; }

export function MemoryInspector({ memory }: MemoryInspectorProps) {
  const selectedMemoryEventId = useAgentStore((state) => state.selectedMemoryEventId);
  const event = memory.find((candidate) => candidate.id === selectedMemoryEventId) ?? memory[0];
  const related = memory.filter((candidate) => candidate.id !== event.id && candidate.cycleId === event.cycleId).slice(0, 3);
  const stockMatch = event.subject.match(/\b([A-Z]{2,5})\b/);
  const targetStock = stockMatch ? stockMatch[1] : null;
  const hasPairing = event.subject.toLowerCase().includes("pair") || event.eventType === "PAIRING" || event.subject.includes("×");
  const hasLaunch = event.subject.toLowerCase().includes("launch") || event.eventType === "LAUNCH" || event.currentState.includes("Launch");

  return <section aria-labelledby="memory-inspector-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="memory-inspector-title" className="protocol-label">Selected memory</h2><p className="protocol-label">Cycle {event.cycleId}</p></div><AnimatePresence mode="wait"><motion.div key={event.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="p-5"><p className="font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-accent)]">{event.id}</p><h3 className="mt-5 text-2xl font-medium leading-[0.98] tracking-[-0.065em]">{event.subject} · {event.decision.replaceAll("_", " ")}</h3><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{event.summary}</p><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.6rem] tracking-[0.07em] uppercase"><Fact label="Category" value={event.eventType.replaceAll("_", " ")} /><Fact label="Actor" value={event.actor.replaceAll("_", " ")} /><Fact label="Timestamp" value={`${formatClock(event.timestamp)} UTC`} /><Fact label="Previous" value={event.previousState} /><Fact label="Current" value={event.currentState} /></dl><div className="mt-6"><p className="protocol-label">Structured evidence</p><dl className="mt-3 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.6rem] tracking-[0.07em] uppercase">{event.structuredEvidence.map((item) => <Fact key={item.label} label={item.label} value={item.value} />)}</dl></div>{related.length > 0 ? <div className="mt-6"><p className="protocol-label">Related memory / current cycle</p><ul className="mt-3 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)]">{related.map((item) => <li key={item.id} className="py-3"><strong className="block text-sm font-medium">{item.subject} · {item.decision.replaceAll("_", " ")}</strong><span className="mt-1 block font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{item.eventType.replaceAll("_", " ")} / {item.id}</span></li>)}</ul></div> : null}<nav aria-label="Related protocol state" className="mt-6 flex flex-wrap gap-3 font-mono text-[0.59rem] tracking-[0.07em] uppercase">{targetStock ? <Link href={`/stock/${targetStock}`} className="text-[var(--jevo-muted)] transition-colors hover:text-[var(--jevo-accent)]">Open {targetStock} ↗</Link> : null}{hasPairing ? <Link href="/pairing" className="text-[var(--jevo-muted)] transition-colors hover:text-[var(--jevo-accent)]">Open pairing ↗</Link> : null}{hasLaunch ? <Link href="/launch" className="text-[var(--jevo-muted)] transition-colors hover:text-[var(--jevo-accent)]">Open launch ↗</Link> : null}</nav></motion.div></AnimatePresence></section>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-48 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
