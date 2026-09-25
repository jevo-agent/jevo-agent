"use client";

import { motion } from "framer-motion";

import { useAgentStore } from "@/store/agent-store";
import type { Launch } from "@/types/launch";

interface LaunchCycleProps { launch: Launch; }

export function LaunchCycle({ launch }: LaunchCycleProps) {
  const selectedLaunchStageId = useAgentStore((state) => state.selectedLaunchStageId);
  const setSelectedLaunchStageId = useAgentStore((state) => state.setSelectedLaunchStageId);

  return <section aria-labelledby="launch-cycle-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="launch-cycle-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">24H launch cycle</h2><p className="protocol-label">State-driven / select a stage</p></div><div role="group" aria-label="Launch cycle stages" className="grid md:grid-cols-2 xl:grid-cols-3">{launch.stages.map((stage, index) => { const selected = selectedLaunchStageId === stage.id; return <button key={stage.id} type="button" aria-pressed={selected} onClick={() => setSelectedLaunchStageId(stage.id)} className={selected ? "relative min-h-52 border-r border-b border-[var(--jevo-line)] bg-[var(--jevo-accent-soft)] p-5 text-left transition-colors" : "relative min-h-52 border-r border-b border-[var(--jevo-line)] p-5 text-left transition-colors hover:bg-white/3"}><span className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)]">{stage.scheduledPoint}</span><h3 className="mt-5 text-xl font-medium leading-5 tracking-[-0.06em] text-[var(--jevo-text)]">{stage.id.replaceAll("_", " ")}</h3><span className={stage.status === "ACTIVE" ? "mt-4 inline-block font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "mt-4 inline-block font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase"}>{stage.status === "COMPLETE" ? "Complete" : stage.status === "ACTIVE" ? "Current / active" : "Future / pending"}</span><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{stage.description}</p>{selected ? <motion.span layoutId="selected-launch-stage" className="absolute right-0 bottom-0 left-0 h-0.5 bg-[var(--jevo-accent)]" transition={{ duration: 0.2 }} /> : null}<span className="absolute right-5 bottom-5 font-mono text-[0.58rem] text-[var(--jevo-muted)]">{String(index + 1).padStart(2, "0")}</span></button>; })}</div></section>;
}
