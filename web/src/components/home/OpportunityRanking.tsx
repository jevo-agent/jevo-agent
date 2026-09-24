"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { SectionHeading } from "@/components/home/AgentTerminal";
import { formatClock } from "@/lib/format";
import { useAgentStore } from "@/store/agent-store";
import type { Stock } from "@/types/stock";

interface OpportunityRankingProps {
  assets: Stock[];
  rankedSymbols: string[];
  cycle: number;
}

export function OpportunityRanking({ assets, rankedSymbols, cycle }: OpportunityRankingProps) {
  const setSelectedAssetSymbol = useAgentStore((state) => state.setSelectedAssetSymbol);
  const orderedAssets = rankedSymbols.flatMap((symbol) => assets.filter((asset) => asset.symbol === symbol));
  const featured = orderedAssets[0];

  if (!featured) return null;

  return (
    <section id="market" className="scroll-mt-6 border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="market-title">
      <div className="protocol-shell">
        <SectionHeading id="market-title" index="02 / Opportunity rank" title="What should exist next?" meta={`Last decision cycle / ${cycle}\nSort / JEVO opportunity`} />
        <div className="mt-10 grid border-t border-[var(--jevo-line)] lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="hidden grid-cols-[44px_minmax(0,1fr)_minmax(160px,0.8fr)_72px_110px] gap-4 border-b border-[var(--jevo-line)] px-4 py-3 font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase md:grid">
              <span>Rank</span><span>Asset</span><span>Pairability</span><span>Move</span><span>JEV</span>
            </div>
            {orderedAssets.map((asset, index) => {
              const isRising = asset.rankMovement > 0;
              const movement = asset.rankMovement === 0 ? "— 0" : `${isRising ? "▲" : "▼"} ${isRising ? "+" : ""}${asset.rankMovement}`;
              return (
                <motion.div key={asset.symbol} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.2, delay: index * 0.035 }}>
                  <Link href={`/stock/${asset.symbol}`} onClick={() => setSelectedAssetSymbol(asset.symbol)} className="grid min-h-25 grid-cols-[40px_minmax(0,1fr)_64px] items-center gap-4 border-b border-[var(--jevo-line)] px-4 py-4 transition-colors hover:bg-[rgb(255_255_255_/_1.5%)] md:grid-cols-[44px_minmax(0,1fr)_minmax(160px,0.8fr)_72px_110px]" aria-label={`Open ${asset.symbol} intelligence`}>
                    <span className="font-mono text-sm text-[var(--jevo-text)]">{String(asset.currentRank).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <strong className="block text-xl font-medium tracking-[-0.06em] text-[var(--jevo-text)]">{asset.symbol}</strong>
                      <span className="mt-1 block truncate font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{asset.name} / evaluated {formatClock(asset.lastEvaluatedAt)} UTC</span>
                    </span>
                    <span className="hidden md:block">
                      <span className="flex items-center gap-3"><span className="h-1 flex-1 bg-[rgb(240_242_233_/_8%)]"><span className="block h-full bg-[var(--jevo-accent)]" style={{ width: `${asset.opportunityScore}%` }} /></span><span className="font-mono text-xs text-[var(--jevo-text)]">{asset.opportunityScore}</span></span>
                      <span className="mt-2 block font-mono text-[0.6rem] text-[var(--jevo-muted)]">PREV #{asset.previousRank} / {asset.previousScore}</span>
                    </span>
                    <span className={isRising ? "hidden font-mono text-xs text-[var(--jevo-accent)] md:block" : "hidden font-mono text-xs text-[var(--jevo-muted)] md:block"}>{movement}</span>
                    <span className="hidden border border-[var(--jevo-line)] px-2 py-1 text-center font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase md:block">{asset.jevDecision.replace("_", " ")}</span>
                    <span className="font-mono text-sm text-[var(--jevo-accent)] md:hidden">{asset.opportunityScore}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <aside className="flex min-h-90 flex-col justify-between border-b border-[var(--jevo-line)] p-6 lg:border-l lg:border-b-0">
            <div>
              <p className="protocol-label">JEV decision / highest-ranked asset</p>
              <p className="mt-5 text-7xl tracking-[-0.1em] text-[var(--jevo-accent)]">#{String(featured.currentRank).padStart(2, "0")}</p>
              <h3 className="mt-4 text-3xl font-medium tracking-[-0.075em] text-[var(--jevo-text)]">{featured.symbol} was promoted.</h3>
              <p className="mt-4 max-w-md leading-7 text-[var(--jevo-muted)]">Three material signals changed in the current cycle. Narrative momentum accelerated, crypto-cultural adjacency remained high, and pair compatibility improved against the prior state.</p>
            </div>
            <dl className="mt-8 border-t border-[var(--jevo-line)] font-mono text-[0.65rem] tracking-[0.07em] uppercase">
              <Fact label="Previous rank" value={`#${featured.previousRank}`} /><Fact label="Current rank" value={`#${featured.currentRank}`} /><Fact label="Opportunity" value={featured.opportunityScore.toString()} /><Fact label="Confidence" value={`${featured.confidence}%`} />
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[var(--jevo-line)] py-3 text-[var(--jevo-muted)]"><dt>{label}</dt><dd className="text-[var(--jevo-text)]">{value}</dd></div>;
}
