import Link from "next/link";

import { SectionHeading } from "@/components/home/AgentTerminal";
import { formatCountdown } from "@/lib/format";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface LaunchCandidatePreviewProps { launch: Launch; pairing: Pairing; }

export function LaunchCandidatePreview({ launch, pairing }: LaunchCandidatePreviewProps) {
  const passedChecks = launch.policyChecks.filter((check) => check.status === "PASSED").length;

  return (
    <section id="launch" className="scroll-mt-6 border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="launch-title">
      <div className="protocol-shell">
        <SectionHeading id="launch-title" index="05 / Controlled launch" title="What happens next." meta={`Launch cycle / ${launch.cycleId}\nDisplay state / Phase 0`} />
        <div className="mt-10 grid border border-[var(--jevo-line)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <p className="protocol-label">Current launch candidate / guardian controlled</p>
            <h3 className="mt-5 text-6xl font-medium tracking-[-0.1em] text-[var(--jevo-text)] sm:text-7xl">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></h3>
            <div className="mt-8 grid border-y border-[var(--jevo-line)] sm:grid-cols-3">
              <LaunchMetric label="Pair score" value={pairing.pairScore.toString()} /><LaunchMetric label="Readiness" value={launch.readiness} accent /><LaunchMetric label="Policy checks" value={`${passedChecks} / ${launch.policyChecks.length}`} />
            </div>
            <p className="mt-7 max-w-xl leading-7 text-[var(--jevo-muted)]">This is a structured launch-candidate state only. No transaction, wallet action, contract deployment, or chain execution is simulated in Phase 0.</p>
            <Link href={`/launch/${launch.selectedPairingSlug}`} className="mt-7 inline-flex items-center gap-4 border border-[var(--jevo-accent)] px-5 py-3 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-accent)] uppercase transition-colors hover:bg-[var(--jevo-accent)] hover:text-[#080a07]"><span>Open launch candidate</span><span aria-hidden="true">↗</span></Link>
          </div>
          <aside className="border-t border-[var(--jevo-line)] lg:border-t-0 lg:border-l">
            <div className="border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">Next lifecycle transition</p><p className="mt-4 font-mono text-4xl tracking-[-0.08em] text-[var(--jevo-accent)]">{formatCountdown(launch.countdownSeconds)}</p><p className="mt-2 text-sm leading-6 text-[var(--jevo-muted)]">Countdown to the next controlled lifecycle stage, not a transaction timer.</p></div>
            <div className="divide-y divide-[var(--jevo-line)]">
              <LaunchState label="Current stage" value={launch.stage.replaceAll("_", " ")} accent /><LaunchState label="Guardian" value={launch.guardianRequirement.required ? launch.guardianRequirement.status : "Not required"} /><LaunchState label="Transaction" value={launch.transactionState.replaceAll("_", " ")} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function LaunchMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="border-b border-[var(--jevo-line)] py-5 last:border-b-0 sm:border-r sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:border-r-0"><p className="protocol-label">{label}</p><p className={accent ? "mt-2 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-accent)]" : "mt-2 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]"}>{value}</p></div>;
}

function LaunchState({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-start justify-between gap-5 px-6 py-5 font-mono text-[0.65rem] tracking-[0.07em] uppercase"><span className="text-[var(--jevo-muted)]">{label}</span><span className={accent ? "max-w-48 text-right text-[var(--jevo-accent)]" : "max-w-48 text-right text-[var(--jevo-text)]"}>{value}</span></div>;
}
