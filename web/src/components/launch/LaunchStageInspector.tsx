"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useAgentStore } from "@/store/agent-store";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface LaunchStageInspectorProps { launch: Launch; pairing: Pairing; }

export function LaunchStageInspector({ launch, pairing }: LaunchStageInspectorProps) {
  const selectedLaunchStageId = useAgentStore((state) => state.selectedLaunchStageId);
  const stage = launch.stages.find((candidate) => candidate.id === selectedLaunchStageId) ?? launch.stages.find((candidate) => candidate.id === launch.stage) ?? launch.stages[0];

  return <section aria-labelledby="launch-stage-inspector-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="launch-stage-inspector-title" className="protocol-label">Selected stage</h2><span className="protocol-label">{stage.scheduledPoint}</span></div><AnimatePresence mode="wait"><motion.div key={stage.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="p-5"><p className="text-3xl font-medium leading-[0.93] tracking-[-0.075em]">{stage.id.replaceAll("_", " ")}</p><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">{stage.description}</p><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase"><Fact label="Status" value={stage.status === "ACTIVE" ? "Current / active" : stage.status === "COMPLETE" ? "Complete" : "Future / pending"} accent={stage.status === "ACTIVE"} /><Fact label="Scheduled point" value={stage.scheduledPoint} /><Fact label="Pair" value={`${pairing.stockSymbol} × ${pairing.symbol}`} /><Fact label="Next requirement" value={stage.requirement} /></dl></motion.div></AnimatePresence></section>;
}

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="flex items-start justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className={accent ? "max-w-42 text-right text-[var(--jevo-accent)]" : "max-w-42 text-right text-[var(--jevo-text)]"}>{value}</dd></div>; }
