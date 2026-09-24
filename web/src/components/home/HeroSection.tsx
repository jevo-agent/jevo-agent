import Link from "next/link";

import type { AgentRuntime } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface HeroSectionProps {
  agent: AgentRuntime;
  featuredAsset: Stock;
}

export function HeroSection({ agent, featuredAsset }: HeroSectionProps) {
  return (
    <>
      <header className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_78%)]">
        <div className="protocol-shell flex min-h-20 items-center justify-between gap-6">
          <Link href="/" className="group flex items-center gap-3" aria-label="JEVO home">
            <span className="grid size-6 place-items-center border border-[var(--jevo-line-strong)]" aria-hidden="true">
              <span className="size-1.5 bg-[var(--jevo-accent)]" />
            </span>
            <span className="font-mono text-sm font-medium tracking-[0.16em]">JEVO</span>
          </Link>
          <nav className="hidden items-center gap-6 font-mono text-[0.65rem] tracking-[0.1em] text-[var(--jevo-muted)] uppercase lg:flex" aria-label="Primary navigation">
            <a href="#agent">Agent</a>
            <a href="#market">Market</a>
            <a href="#pairings">Pairings</a>
            <a href="#launch">Launch</a>
            <a href="#memory">Memory</a>
          </nav>
          <div className="hidden border border-[var(--jevo-line)] px-3 py-2 font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase sm:block">
            Decision layer / <span className="text-[var(--jevo-accent)]">Jev</span>
          </div>
        </div>
      </header>

      <section className="protocol-shell grid gap-10 py-12 lg:min-h-[690px] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-20" aria-labelledby="hero-title">
        <div className="flex flex-col justify-between self-stretch">
          <div>
            <p className="protocol-label flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />
              Autonomous Market Intelligence
            </p>
            <h1 id="hero-title" className="mt-6 max-w-xl text-[clamp(3.8rem,8vw,7.75rem)] font-medium leading-[0.82] tracking-[-0.095em] text-[var(--jevo-text)]">
              Markets move.<br />
              <span className="text-transparent [-webkit-text-stroke:1px_var(--jevo-text)]">JEVO</span>{" "}
              <span className="text-[var(--jevo-accent)]">decides.</span>
            </h1>
            <div className="mt-10 max-w-md border-l border-[var(--jevo-line-strong)] pl-5">
              <p className="protocol-label">Powered by Jev</p>
              <p className="mt-3 text-lg leading-7 tracking-[-0.03em] text-[#c8cdc0]">
                An autonomous market agent continuously evaluating Stock Tokens,
                narratives, and cultural signals to discover the next stock-native
                meme opportunity.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#agent" className="inline-flex items-center gap-4 border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-5 py-3 font-mono text-xs font-medium tracking-[0.08em] text-[#080a07] uppercase transition-colors hover:bg-transparent hover:text-[var(--jevo-accent)]">
              Watch the agent <span aria-hidden="true">↘</span>
            </a>
            <a href="#market" className="inline-flex items-center border border-[var(--jevo-line-strong)] px-5 py-3 font-mono text-xs tracking-[0.08em] text-[var(--jevo-text)] uppercase transition-colors hover:border-[var(--jevo-accent)]">
              View current opportunity
            </a>
          </div>
        </div>

        <section className="border border-[var(--jevo-line)] bg-[var(--jevo-panel)]" aria-label="Current JEV decision bus">
          <div className="flex items-center justify-between border-b border-[var(--jevo-line)] px-5 py-4 font-mono text-[0.625rem] tracking-[0.1em] text-[var(--jevo-muted)] uppercase">
            <span>JEVO / Decision bus</span>
            <span>Cycle {agent.activeCycle} / State delta +06</span>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5 border-b border-[var(--jevo-line)] pb-6">
              <div>
                <p className="protocol-label">Bounded evaluation / current priority asset</p>
                <p className="mt-2 font-mono text-sm tracking-[0.04em] text-[var(--jevo-text)]">{featuredAsset.symbol} / OPPORTUNITY REVIEW</p>
              </div>
              <span className="shrink-0 border border-[var(--jevo-accent)] px-2 py-1 font-mono text-[0.6rem] tracking-[0.09em] text-[var(--jevo-accent)] uppercase">JEV ACTIVE</span>
            </div>
            <div className="divide-y divide-[var(--jevo-line)]">
              {featuredAsset.signals.slice(0, 5).map((signal, index) => (
                <div key={signal.id} className="grid grid-cols-[24px_minmax(0,1fr)_32px_48px] items-center gap-3 py-4 font-mono text-[0.6875rem]">
                  <span className="text-[#667060]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <span className="block truncate uppercase text-[#b7beb0]">{signal.label}</span>
                    <span className="mt-1 block truncate text-[0.6rem] text-[var(--jevo-muted)]">{signal.context}</span>
                  </div>
                  <span className="text-right text-[var(--jevo-text)]">{signal.score}</span>
                  <span className="text-right text-[var(--jevo-accent)]">{signal.deltaLabel}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 border-y border-[var(--jevo-line)] py-5 sm:grid-cols-[110px_1fr_90px] sm:items-center">
              <p className="protocol-label">Structured decision</p>
              <div>
                <strong className="text-3xl tracking-[-0.07em] text-[var(--jevo-accent)]">{featuredAsset.jevDecision}</strong>
                <p className="mt-1 font-mono text-[0.65rem] tracking-[0.06em] text-[var(--jevo-muted)]">{featuredAsset.symbol} / RANK #{featuredAsset.previousRank} → #{featuredAsset.currentRank} / OPPORTUNITY {featuredAsset.opportunityScore}</p>
              </div>
              <div className="border-l border-[var(--jevo-line)] pl-4 sm:text-right">
                <p className="protocol-label">Confidence</p>
                <strong className="text-xl text-[var(--jevo-text)]">{featuredAsset.confidence}%</strong>
              </div>
            </div>
            <div className="grid gap-4 pt-5 font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase sm:grid-cols-3">
              <p>Previous state <span className="mt-1 block text-[var(--jevo-text)]">#{featuredAsset.previousRank} / {featuredAsset.previousScore}</span></p>
              <p>Current state <span className="mt-1 block text-[var(--jevo-text)]">#{featuredAsset.currentRank} / {featuredAsset.opportunityScore}</span></p>
              <p>Next action <span className="mt-1 block text-[var(--jevo-accent)]">PAIR REVIEW</span></p>
            </div>
          </div>
          <div className="grid border-t border-[var(--jevo-line)] font-mono text-[0.625rem] tracking-[0.08em] uppercase sm:grid-cols-3">
            <p className="border-b border-[var(--jevo-line)] px-5 py-4 text-[var(--jevo-muted)] sm:border-r sm:border-b-0">Current operation <span className="mt-1 block text-[var(--jevo-text)]">{agent.currentOperation}</span></p>
            <p className="border-b border-[var(--jevo-line)] px-5 py-4 text-[var(--jevo-muted)] sm:border-r sm:border-b-0">Current cycle <span className="mt-1 block text-[var(--jevo-accent)]">{agent.scanProgress}%</span></p>
            <p className="px-5 py-4 text-[var(--jevo-muted)]">Latest action <span className="mt-1 block text-[var(--jevo-text)]">{featuredAsset.jevDecision} {featuredAsset.symbol}</span></p>
          </div>
        </section>
      </section>

      <div className="overflow-hidden border-y border-[var(--jevo-line)] bg-[var(--jevo-panel)]">
        <div className="protocol-shell flex min-w-max items-center gap-10 py-3 font-mono text-[0.625rem] tracking-[0.1em] text-[var(--jevo-muted)] uppercase">
          <span>Observe → Decide → Pair → Launch</span><span>{featuredAsset.symbol} ↑ #{featuredAsset.currentRank} / JEV {featuredAsset.jevDecision}</span><span>{agent.qualifiedCandidates} Active candidates</span><span>{agent.narrativesDetected} Narratives detected</span><span className="text-[var(--jevo-accent)]">JEV Active</span>
        </div>
      </div>
    </>
  );
}
