"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import type { Stock } from "@/types/stock";

interface AssetMemoryPathProps { asset: Stock; }

export function AssetMemoryPath({ asset }: AssetMemoryPathProps) {
  return <section aria-labelledby="asset-memory-path-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="asset-memory-path-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">{asset.symbol} memory path</h2><Link href={`/stock/${asset.symbol}`} className="font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-accent)]">Open stock detail ↗</Link></div><div className="p-6"><ol className="grid gap-4">{asset.scoreHistory.map((point, index) => <li key={point.timestamp} className="grid grid-cols-[4rem_minmax(0,1fr)_3rem] items-center gap-4 font-mono text-[0.65rem]"><time dateTime={point.timestamp} className="text-[var(--jevo-muted)]">{index === asset.scoreHistory.length - 1 ? "NOW" : formatClock(point.timestamp).slice(0, 5)}</time><div className="h-1 bg-white/8"><motion.span className="block h-full origin-left bg-[var(--jevo-accent)]" initial={{ scaleX: 0 }} whileInView={{ scaleX: point.score / 100 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: index * 0.04 }} /></div><span className="text-right text-[var(--jevo-text)]">{point.score.toFixed(1)}</span></li>)}</ol><div className="mt-7 border-t border-[var(--jevo-line)] pt-4"><p className="protocol-label">Rank progression</p><p className="mt-3 font-mono text-lg tracking-[-0.06em] text-[var(--jevo-text)]">{asset.rankHistory.map((point) => `#${String(point.rank).padStart(2, "0")}`).join(" → ")}</p></div></div></section>;
}
