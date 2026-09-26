"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { PairingLifecycle } from "@/components/pairing/PairingLifecycle";
import { formatClock } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingInspectorProps {
  pairing: Pairing | undefined;
  stock: Stock | undefined;
  agent: AgentRuntime;
}

export function PairingInspector({ pairing, stock, agent }: PairingInspectorProps) {
  if (!pairing || !stock) {
    return <aside className="p-6"><p className="protocol-label">Selected pairing</p><p className="mt-4 text-[var(--jevo-muted)]">No pairing matches the current marketplace controls.</p></aside>;
  }

  return (
    <aside aria-label="Selected pairing inspector">
      <div className="flex items-center justify-between border-b border-[var(--jevo-line)] px-5 py-4"><p className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Selected pairing</p><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">JEV pairing analysis</p></div>
      <AnimatePresence mode="wait">
        <motion.div key={pairing.slug} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: 0.18 }} className="p-6">
          <h2 className="text-4xl font-medium tracking-[-0.09em] text-[var(--jevo-text)]">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></h2>
          <Link href={`/stock/${stock.symbol}`} className="mt-2 inline-block font-mono text-[0.65rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-accent)]">{stock.name} / Rank #{String(stock.currentRank).padStart(2, "0")} ↗</Link>
          <div className="mt-6 grid grid-cols-2 border-t border-l border-[var(--jevo-line)]"><InspectorMetric label="Pair score" value={pairing.pairScore.toString()} accent /><InspectorMetric label="Status" value={pairing.status.replaceAll("_", " ")} /><InspectorMetric label="JEV decision" value={pairing.jevDecision.replace("_", " ")} /><InspectorMetric label="Confidence" value={pairing.confidence === null ? "—" : `${pairing.confidence}%`} /></div>
          <div className="mt-6"><p className="protocol-label">Pair thesis / Phase 0 simulated analysis</p><dl className="mt-3 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)]"><Thesis label="Why stock?" value={pairing.thesis.whyStock} /><Thesis label="Why meme?" value={pairing.thesis.whyMeme} /><Thesis label="Why pair?" value={pairing.thesis.whyPair} /><Thesis label="Why now?" value={pairing.thesis.whyNow} /></dl></div>
          <div className="mt-6"><p className="protocol-label">JEV factor evidence</p><div className="mt-3 grid grid-cols-2 border-t border-l border-[var(--jevo-line)]">{pairing.factors.map((item) => <div key={item.id} className="border-r border-b border-[var(--jevo-line)] p-3"><p className="font-mono text-[0.58rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{item.label}</p><p className="mt-1 font-mono text-xl text-[var(--jevo-text)]">{item.score}</p></div>)}</div></div>
          <PairingLifecycle pairing={pairing} />
          <dl className="mt-6 border-y border-[var(--jevo-line)] font-mono text-[0.625rem] tracking-[0.07em] uppercase"><InspectorLine label="Last evaluated" value={`${formatClock(stock.lastEvaluatedAt)} UTC`} /><InspectorLine label="Data freshness" value={agent.dataFreshness} /><InspectorLine label="Next action" value={pairing.status === "LAUNCH_CANDIDATE" ? "Launch readiness review" : "Curation review"} /></dl>
          <Link href={`/pairing/${pairing.slug}`} className="mt-6 flex items-center justify-between border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-4 py-3 font-mono text-[0.65rem] tracking-[0.08em] text-[#080a07] uppercase transition-colors hover:bg-transparent hover:text-[var(--jevo-accent)]"><span>Open pairing detail</span><span aria-hidden="true">↗</span></Link>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function InspectorMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="border-r border-b border-[var(--jevo-line)] p-4"><p className="protocol-label">{label}</p><p className={accent ? "mt-2 font-mono text-xl tracking-[-0.07em] text-[var(--jevo-accent)]" : "mt-2 font-mono text-sm leading-5 text-[var(--jevo-text)]"}>{value}</p></div>;
}

function Thesis({ label, value }: { label: string; value: string }) {
  return <div className="py-4"><dt className="font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-text)] uppercase">{label}</dt><dd className="mt-2 text-sm leading-6 text-[var(--jevo-muted)]">{value}</dd></div>;
}

function InspectorLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[var(--jevo-line)] py-3 last:border-b-0"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-48 text-right text-[var(--jevo-text)]">{value}</dd></div>;
}
