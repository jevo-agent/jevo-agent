import Link from "next/link";

import type { Pairing } from "@/types/pairing";

interface PairingNextActionProps { pairing: Pairing; }

export function PairingNextAction({ pairing }: PairingNextActionProps) {
  const isLaunchCandidate = pairing.status === "LAUNCH_CANDIDATE";

  return (
    <section aria-labelledby="pairing-next-action-title">
      <div className="border-b border-[var(--jevo-line)] p-5"><p className="protocol-label">JEV pairing analysis</p><div className="mt-5 flex items-end justify-between gap-4"><h2 className="text-3xl font-medium tracking-[-0.08em] text-[var(--jevo-accent)]">{pairing.jevDecision.replaceAll("_", " ")}</h2><span className="font-mono text-lg text-[var(--jevo-text)]">{pairing.confidence}%</span></div><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">Structured evidence is published as observable factor states, not an internal model monologue.</p><ul className="mt-5 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)]">{pairing.factors.slice(0, 5).map((factor) => <li key={factor.id} className="flex justify-between gap-4 py-3 font-mono text-[0.61rem] tracking-[0.06em] uppercase"><span className="text-[var(--jevo-muted)]">{factor.label}</span><span className="text-[var(--jevo-text)]">{factor.score}</span></li>)}</ul></div>
      <div className="p-5"><p className="protocol-label">Next action</p><h2 id="pairing-next-action-title" className="mt-4 text-2xl font-medium tracking-[-0.065em]">{isLaunchCandidate ? "Launch readiness review" : "Curation review"}</h2><p className="mt-3 text-sm leading-6 text-[var(--jevo-muted)]">{isLaunchCandidate ? "Review readiness before any controlled execution. No transaction has been submitted in Phase 0." : "Keep the pairing in the published review process until its next lifecycle change."}</p>{isLaunchCandidate ? <Link href={`/launch/${pairing.slug}`} className="mt-6 flex items-center justify-between border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-4 py-3 font-mono text-[0.64rem] tracking-[0.08em] text-[#080a07] uppercase transition-colors hover:bg-transparent hover:text-[var(--jevo-accent)]"><span>Open launch readiness</span><span aria-hidden="true">↗</span></Link> : null}<Link href="/pairing" className="mt-4 block font-mono text-[0.61rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-accent)]">Back to pairing marketplace ←</Link></div>
    </section>
  );
}
