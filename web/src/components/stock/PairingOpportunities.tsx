import Link from "next/link";

import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingOpportunitiesProps { asset: Stock; pairing: Pairing | undefined; }

export function PairingOpportunities({ asset, pairing }: PairingOpportunitiesProps) {
  if (!pairing) return null;

  const opportunities = [
    { label: `${asset.symbol} × ${pairing.symbol}`, score: pairing.pairScore, description: pairing.thesis.core, href: `/pairing/${pairing.slug}` },
    ...pairing.alternatives.map((alternative) => ({ label: `${asset.symbol} × ${alternative.symbol}`, score: alternative.pairScore, description: alternative.rationale, href: "/pairing" })),
  ];

  return (
    <section className="flex h-full flex-col" aria-labelledby="pairing-opportunities-title">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="pairing-opportunities-title" className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">Pairing opportunities</h2><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">{opportunities.length} candidates</p></div>
      <div className="divide-y divide-[var(--jevo-line)]">
        {opportunities.map((opportunity, index) => <Link key={opportunity.label} href={opportunity.href} className="block p-5 transition-colors hover:bg-[rgb(255_255_255_/_1.5%)]" aria-label={`Open ${opportunity.label} pairing analysis`}><div className="flex items-baseline justify-between gap-4"><strong className="text-xl font-medium tracking-[-0.06em] text-[var(--jevo-text)]">{opportunity.label.split(" × ")[0]} × <span className={index === 0 ? "text-[var(--jevo-accent)]" : "text-[var(--jevo-text)]"}>{opportunity.label.split(" × ")[1]}</span></strong><em className={index === 0 ? "font-mono text-lg not-italic text-[var(--jevo-accent)]" : "font-mono text-lg not-italic text-[var(--jevo-text)]"}>{opportunity.score}</em></div><p className="mt-2 text-sm leading-6 text-[var(--jevo-muted)]">{opportunity.description}</p></Link>)}
      </div>
      <div className="mt-auto border-t border-[var(--jevo-line)] p-5"><p className="text-sm leading-6 text-[var(--jevo-muted)]">Pair score is an independent JEV thesis; it does not automatically follow the stock rank.</p><Link href="/pairing" className="mt-4 flex items-center justify-between border border-[var(--jevo-line-strong)] px-4 py-3 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase transition-colors hover:border-[var(--jevo-accent)]"><span>Open pairing analysis</span><span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}
