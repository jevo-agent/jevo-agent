"use client";

import { motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingRowProps {
  pairing: Pairing;
  stock: Stock;
  index: number;
  selected: boolean;
  onSelect: (slug: string) => void;
}

export function PairingRow({ pairing, stock, index, selected, onSelect }: PairingRowProps) {
  const status = pairing.status.replaceAll("_", " ");

  return (
    <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, delay: index * 0.025 }}>
      <button type="button" onClick={() => onSelect(pairing.slug)} aria-pressed={selected} className={selected ? "relative grid min-h-27 w-full grid-cols-[32px_minmax(0,1fr)_60px] items-center gap-4 border-b border-[var(--jevo-line)] bg-[linear-gradient(90deg,rgb(2_198_165_/_5%),transparent_72%)] px-4 py-4 text-left md:grid-cols-[36px_minmax(0,1.1fr)_minmax(150px,0.8fr)_58px_128px_minmax(130px,0.8fr)]" : "grid min-h-27 w-full grid-cols-[32px_minmax(0,1fr)_60px] items-center gap-4 border-b border-[var(--jevo-line)] px-4 py-4 text-left transition-colors hover:bg-[rgb(255_255_255_/_1.5%)] md:grid-cols-[36px_minmax(0,1.1fr)_minmax(150px,0.8fr)_58px_128px_minmax(130px,0.8fr)]"}>
        {selected && <motion.span layoutId="selected-pairing-row" className="absolute top-3 bottom-3 left-0 w-0.5 bg-[var(--jevo-accent)]" transition={{ duration: 0.18 }} />}
        <span className="font-mono text-sm text-[#667060]">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0"><strong className="block text-xl font-medium tracking-[-0.06em] text-[var(--jevo-text)]">{pairing.stockSymbol} × <span className={selected ? "text-[var(--jevo-accent)]" : "text-[var(--jevo-text)]"}>{pairing.symbol}</span></strong><span className="mt-1 block truncate font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{pairing.memeName} / JEV {pairing.jevDecision.replace("_", " ")}</span></span>
        <span className="hidden md:block"><strong className="font-mono text-sm text-[var(--jevo-text)]">{stock.symbol}</strong><span className="mt-1 block font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">Rank #{String(stock.currentRank).padStart(2, "0")} / {stock.opportunityScore}</span></span>
        <span className="hidden font-mono text-base text-[var(--jevo-text)] md:block">{pairing.pairScore}</span>
        <span className={pairing.status === "LAUNCH_CANDIDATE" ? "hidden border border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] px-2 py-1 text-center font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-accent)] uppercase md:block" : "hidden border border-[var(--jevo-line)] px-2 py-1 text-center font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase md:block"}>{status}</span>
        <span className="hidden font-mono text-[0.6rem] leading-5 tracking-[0.06em] text-[var(--jevo-muted)] uppercase md:block">{pairing.thesis.whyNow}<small className="mt-1 block text-[#667060]">evaluated {formatClock(stock.lastEvaluatedAt)} UTC</small></span>
        <span className="font-mono text-lg text-[var(--jevo-accent)] md:hidden">{pairing.pairScore}</span>
      </button>
    </motion.li>
  );
}
