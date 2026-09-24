import type { Stock } from "@/types/stock";

interface JevDecisionEngineProps { asset: Stock; cycle: number; }

export function JevDecisionEngine({ asset, cycle }: JevDecisionEngineProps) {
  return (
    <section className="border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="decision-title">
      <div className="protocol-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="flex flex-col justify-between border-t border-[var(--jevo-line)] pt-6">
          <div>
            <p className="protocol-label">03 / Why Jev?</p>
            <h2 id="decision-title" className="mt-6 text-5xl font-medium leading-[0.91] tracking-[-0.085em] text-[var(--jevo-text)] sm:text-6xl">Most AI systems are built to <span className="text-[var(--jevo-accent)]">generate.</span><br />JEVO is built to <em className="font-serif font-normal">decide.</em></h2>
          </div>
          <p className="mt-10 font-mono text-[0.65rem] tracking-[0.1em] text-[var(--jevo-muted)] uppercase">Decision layer / continuous evaluation</p>
        </div>
        <div className="border-t border-[var(--jevo-line)]">
          <div className="grid sm:grid-cols-3">
            {["State", "JEV decision", "Structured action"].map((label, index) => <div key={label} className="border-r border-b border-[var(--jevo-line)] p-5 last:border-r-0"><p className="protocol-label">0{index + 1}</p><p className="mt-8 text-xl tracking-[-0.055em] text-[var(--jevo-text)]">{label}</p></div>)}
          </div>
          <div className="grid border-b border-[var(--jevo-line)] sm:grid-cols-[1fr_160px]">
            <div className="p-6">
              <p className="protocol-label">JEV decision / cycle_{cycle}</p>
              <p className="mt-3 text-4xl font-medium tracking-[-0.08em] text-[var(--jevo-accent)]">{asset.jevDecision}</p>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--jevo-muted)]">JEV classified observable market state: AI infrastructure accelerated while pair compatibility and social velocity remained high enough to change {asset.symbol}&apos;s relative opportunity.</p>
            </div>
            <dl className="border-t border-[var(--jevo-line)] p-6 font-mono text-[0.65rem] tracking-[0.08em] uppercase sm:border-t-0 sm:border-l">
              <div><dt className="text-[var(--jevo-muted)]">Confidence</dt><dd className="mt-1 text-2xl text-[var(--jevo-text)]">{asset.confidence}%</dd></div><div className="mt-5"><dt className="text-[var(--jevo-muted)]">Observed</dt><dd className="mt-1 text-[var(--jevo-text)]">{asset.lastEvaluatedAt.slice(11, 19)} UTC</dd></div>
            </dl>
          </div>
          <div className="grid sm:grid-cols-2">
            <div className="border-r border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">Previous state</p><p className="mt-3 text-2xl tracking-[-0.07em] text-[var(--jevo-text)]">#{asset.previousRank} / {asset.previousScore}</p></div>
            <div className="border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">Current state</p><p className="mt-3 text-2xl tracking-[-0.07em] text-[var(--jevo-accent)]">#{asset.currentRank} / {asset.opportunityScore}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
