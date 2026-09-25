import Link from "next/link";

import type { Pairing } from "@/types/pairing";

interface AlternativePairingsProps { pairing: Pairing; }

export function AlternativePairings({ pairing }: AlternativePairingsProps) {
  return (
    <section aria-labelledby="alternative-pairings-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="alternative-pairings-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Alternative concepts considered</h2><p className="protocol-label">{pairing.alternatives.length} lower-scoring concepts</p></div>
      {pairing.alternatives.length > 0 ? <div className="grid md:grid-cols-2">{pairing.alternatives.map((alternative, index) => <article key={alternative.symbol} className="border-b border-[var(--jevo-line)] p-6 last:border-b-0 md:border-r md:last:border-r-0"><p className="protocol-label">Alternative {String(index + 1).padStart(2, "0")}</p><div className="mt-5 flex items-end justify-between gap-4"><h3 className="text-3xl font-medium tracking-[-0.08em]">{pairing.stockSymbol} × <span className="text-[var(--jevo-muted)]">{alternative.symbol}</span></h3><span className="font-mono text-xl tracking-[-0.06em] text-[var(--jevo-text)]">{alternative.pairScore.toFixed(1)}</span></div><p className="mt-5 max-w-md text-sm leading-6 text-[var(--jevo-muted)]">{alternative.rationale}</p></article>)}</div> : <p className="p-6 text-sm leading-6 text-[var(--jevo-muted)]">No alternative concepts were retained in this pairing state.</p>}
      <div className="flex justify-end px-5 py-4 sm:px-6"><Link href="/pairing" className="font-mono text-[0.62rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-accent)]">Compare in pairing market ↗</Link></div>
    </section>
  );
}
