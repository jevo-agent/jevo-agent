"use client";

import { motion } from "framer-motion";

import { formatClock, formatNumber } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";

interface AgentTerminalProps {
  agent: AgentRuntime;
}

const eventLabels = {
  OBSERVE: "Observe",
  SIGNAL: "Signal",
  JEV_DECISION: "JEV decision",
  PAIRING: "Pair",
  LAUNCH: "Launch",
  MEMORY: "Memory",
  POLICY: "Policy",
  ACTION: "Action",
} as const;

export function AgentTerminal({ agent }: AgentTerminalProps) {
  const metrics = [
    ["Assets scanned", formatNumber(agent.assetsScanned), `of ${formatNumber(agent.assetsInUniverse)} assets`],
    ["Signals processed", formatNumber(agent.signalsProcessed), "market + narrative + social"],
    ["Narratives detected", formatNumber(agent.narrativesDetected), `${agent.materiallyChangedNarratives} materially changed`],
    ["JEV decisions", formatNumber(agent.decisionsProcessed), "current retained history"],
    ["Qualified candidates", formatNumber(agent.qualifiedCandidates), `${agent.highConvictionCandidates} high-conviction`],
    ["Data freshness", agent.dataFreshness, "priority universe"],
  ];

  return (
    <section id="agent" className="scroll-mt-6 border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="agent-title">
      <div className="protocol-shell">
        <SectionHeading index="01 / Live agent state" title="The agent is operating now." meta={`Last full scan / ${formatClock(agent.lastScanAt)} UTC\nData age / ${agent.dataFreshness}`} id="agent-title" />
        <div className="mt-10 grid border border-[var(--jevo-line)] lg:grid-cols-[1.3fr_0.7fr]">
          <div className="min-w-0 border-b border-[var(--jevo-line)] lg:border-r lg:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--jevo-line)] px-5 py-4 font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">
              <span>Agent activity / observable events only</span>
              <span>Phase 0 / simulated state</span>
            </div>
            <div className="divide-y divide-[var(--jevo-line)]">
              {agent.latestEvents.map((event, index) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.25, delay: index * 0.04 }} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 px-5 py-5 sm:grid-cols-[90px_minmax(0,1fr)_96px]">
                  <time className="font-mono text-[0.625rem] text-[#667060]">{formatClock(event.timestamp)}</time>
                  <p className="m-0 text-sm leading-6 text-[#b7beb0]"><strong className="font-medium text-[var(--jevo-text)]">{event.subject}.</strong> {event.summary}</p>
                  <span className={event.type === "JEV_DECISION" ? "font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase"}>{eventLabels[event.type]}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <aside>
            <div className="border-b border-[var(--jevo-line)] p-5">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="protocol-label">Current scan cycle</p>
                  <p className="mt-2 text-5xl tracking-[-0.09em] text-[var(--jevo-text)]">{agent.scanProgress}%</p>
                </div>
                <p className="mb-1 text-right font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">Delta scan<br />cycle_{agent.activeCycle}</p>
              </div>
              <div className="mt-5 h-1 bg-[rgb(240_242_233_/_8%)]" aria-label={`${agent.scanProgress}% of the current scan cycle complete`}>
                <motion.div className="h-full bg-[var(--jevo-accent)]" initial={{ width: 0 }} whileInView={{ width: `${agent.scanProgress}%` }} viewport={{ once: true }} transition={{ duration: 0.65, ease: "easeOut" }} />
              </div>
              <p className="mt-4 font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{agent.status} / JEV {agent.jevStatus} / next scan in {Math.floor(agent.nextCycleInSeconds / 60)}:{String(agent.nextCycleInSeconds % 60).padStart(2, "0")}</p>
            </div>
            <dl className="grid grid-cols-2">
              {metrics.map(([label, value, detail]) => (
                <div key={label} className="border-r border-b border-[var(--jevo-line)] p-5 even:border-r-0">
                  <dt className="protocol-label">{label}</dt>
                  <dd className="mt-2 font-mono text-xl tracking-[-0.06em] text-[var(--jevo-text)]">{value}</dd>
                  <dd className="mt-1 text-[0.7rem] leading-4 text-[var(--jevo-muted)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

interface SectionHeadingProps { index: string; title: string; meta: string; id: string; }

export function SectionHeading({ index, title, meta, id }: SectionHeadingProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_210px] lg:items-end">
      <p className="protocol-label">{index}</p>
      <h2 id={id} className="text-4xl font-medium leading-[0.9] tracking-[-0.075em] text-[var(--jevo-text)] sm:text-5xl">{title}</h2>
      <p className="whitespace-pre-line font-mono text-[0.625rem] leading-5 tracking-[0.08em] text-[var(--jevo-muted)] uppercase lg:text-right">{meta}</p>
    </div>
  );
}
