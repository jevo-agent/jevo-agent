"use client";

import { motion } from "framer-motion";

import { formatCountdown } from "@/lib/format";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface LaunchCountdownProps { launch: Launch; pairing: Pairing; }

export function LaunchCountdown({ launch, pairing }: LaunchCountdownProps) {
  return (
    <section aria-labelledby="launch-countdown-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="launch-countdown-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Launch countdown</h2><p className="protocol-label">Current transition / {launch.stage.replaceAll("_", " ")}</p></div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]"><div className="flex min-h-72 items-center p-6 sm:p-8"><div><p className="protocol-label">Time until controlled execution</p><motion.output aria-live="polite" aria-label={`${formatCountdown(launch.countdownSeconds)} remaining in the simulated launch cycle`} initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }} className="mt-5 block font-mono text-5xl tracking-[-0.1em] text-[var(--jevo-accent)] sm:text-6xl">{formatCountdown(launch.countdownSeconds)}</motion.output><p className="mt-5 max-w-xl leading-7 text-[var(--jevo-muted)]">This is a Phase 0 simulated launch-cycle state. It does not advance stages, submit a transaction, or trigger execution.</p></div></div><div className="border-t border-[var(--jevo-line)] p-6 lg:border-t-0 lg:border-l"><p className="protocol-label">Current stage</p><h3 className="mt-4 text-3xl font-medium leading-[0.94] tracking-[-0.075em]">{launch.stage.replaceAll("_", " ")} <span className="text-[var(--jevo-accent)]">ACTIVE.</span></h3><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">JEV pairing analysis is complete. The protocol is validating the selected Stock Token, meme metadata, and launch-policy constraints before contract preparation.</p><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase"><Fact label="Launch cycle" value={launch.cycleId} /><Fact label="Selected pair" value={`${pairing.stockSymbol} × ${pairing.symbol}`} /><Fact label="Decision source" value="JEV" /><Fact label="Human guardian" value={launch.guardianRequirement.required ? "Required / MVP" : "Not required"} /></dl></div></div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-44 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
