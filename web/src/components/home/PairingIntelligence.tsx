"use client";

import Link from "next/link";

import { SectionHeading } from "@/components/home/AgentTerminal";
import { useAgentStore } from "@/store/agent-store";
import type { Pairing } from "@/types/pairing";

interface PairingIntelligenceProps { pairing: Pairing; }

export function PairingIntelligence({ pairing }: PairingIntelligenceProps) {
  const selectedSignalId = useAgentStore((state) => state.selectedSignalId);
  const setSelectedSignalId = useAgentStore((state) => state.setSelectedSignalId);
  const setSelectedPairingSlug = useAgentStore((state) => state.setSelectedPairingSlug);
  const selectedFactor = pairing.factors.find((factor) => factor.id === selectedSignalId) ?? pairing.factors[0];

  if (!selectedFactor) return null;

  return (
    <section id="pairings" className="scroll-mt-6 border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="pairings-title">
      <div className="protocol-shell">
        <SectionHeading id="pairings-title" index="04 / Pairing intelligence" title="Narrative becomes pairing thesis." meta={`Selected state / ${pairing.stockSymbol} × ${pairing.symbol}\nInteractive decision layer`} />
        <div className="mt-10 grid border border-[var(--jevo-line)] lg:grid-cols-[1.22fr_0.78fr]">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--jevo-line)] px-5 py-4 font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase"><span>JEV / Pairability evaluation engine</span><span>Independent of stock rank</span></div>
            <div className="p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {pairing.factors.map((factor, index) => {
                  const active = factor.id === selectedFactor.id;
                  return <button key={factor.id} type="button" onClick={() => setSelectedSignalId(factor.id)} className={active ? "border border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] p-4 text-left" : "border border-[var(--jevo-line)] p-4 text-left transition-colors hover:border-[var(--jevo-line-strong)]"} aria-pressed={active}>
                    <span className="flex items-start justify-between gap-3"><span><span className="protocol-label">0{index + 1} / JEV signal</span><strong className="mt-2 block text-base font-medium tracking-[-0.04em] text-[var(--jevo-text)]">{factor.label}</strong><small className="mt-1 block text-xs text-[var(--jevo-muted)]">{factor.state}</small></span><span className={active ? "font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-accent)]" : "font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]"}>{factor.score}</span></span>
                  </button>;
                })}
              </div>
              <div className="mt-6 grid border-y border-[var(--jevo-line)] sm:grid-cols-[1fr_130px]">
                <div className="p-5"><p className="protocol-label">Selected evidence / {selectedFactor.source}</p><h3 className="mt-3 text-3xl font-medium tracking-[-0.075em] text-[var(--jevo-text)]">{selectedFactor.label}</h3><p className="mt-3 max-w-xl leading-7 text-[var(--jevo-muted)]">{selectedFactor.explanation}</p></div>
                <div className="border-t border-[var(--jevo-line)] p-5 sm:border-t-0 sm:border-l"><p className="protocol-label">Delta</p><p className="mt-3 font-mono text-4xl tracking-[-0.08em] text-[var(--jevo-accent)]">+{selectedFactor.delta}</p><p className="mt-3 font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{selectedFactor.state}</p></div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                {pairing.factors.slice(0, 4).map((factor) => <div key={factor.id}><p className="protocol-label">{factor.label}</p><p className="mt-1 font-mono text-xl text-[var(--jevo-text)]">{factor.score}</p></div>)}
              </div>
            </div>
          </div>
          <aside className="border-t border-[var(--jevo-line)] lg:border-t-0 lg:border-l">
            <div className="border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">JEV pairing decision</p><h3 className="mt-5 text-5xl font-medium leading-[0.85] tracking-[-0.095em] text-[var(--jevo-accent)]">{pairing.jevDecision.replace("_", " ")}</h3><p className="mt-3 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Confidence / {pairing.confidence}%</p></div>
            <div className="p-6"><p className="text-3xl font-medium tracking-[-0.075em] text-[var(--jevo-text)]">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></p><p className="mt-3 leading-7 text-[var(--jevo-muted)]">{pairing.thesis.core}</p><dl className="mt-6 border-t border-[var(--jevo-line)] font-mono text-[0.65rem] tracking-[0.07em] uppercase"><PairFact label="Pair score" value={pairing.pairScore.toString()} /><PairFact label="State" value={pairing.status.replaceAll("_", " ")} /><PairFact label="Next action" value="Launch readiness review" /></dl>
              <Link href="/pairing" onClick={() => setSelectedPairingSlug(pairing.slug)} className="mt-6 flex items-center justify-between border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-4 py-3 font-mono text-[0.65rem] tracking-[0.08em] text-[#080a07] uppercase transition-colors hover:bg-transparent hover:text-[var(--jevo-accent)]"><span>Open pairing market</span><span aria-hidden="true">↗</span></Link>
            </div>
          </aside>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--jevo-muted)]">A strong stock rank does not automatically create a pairing. JEV evaluates narrative, culture, meme translation, crypto fit, and timing as a distinct thesis.</p>
      </div>
    </section>
  );
}

function PairFact({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[var(--jevo-line)] py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-40 text-right text-[var(--jevo-text)]">{value}</dd></div>;
}
