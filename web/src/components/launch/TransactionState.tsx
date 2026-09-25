import Link from "next/link";

import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface TransactionStateProps { launch: Launch; pairing: Pairing; }

export function TransactionState({ launch, pairing }: TransactionStateProps) {
  return <section aria-labelledby="transaction-state-title"><div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="transaction-state-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Transaction state</h2><p className="protocol-label">{launch.transactionState.replaceAll("_", " ")}</p></div><div className="p-5"><p className="font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-accent)]">{launch.transactionState.replaceAll("_", " ")}</p><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">No onchain transaction has been submitted. Execution becomes available only after final policy validation and guardian approval are complete.</p><div className="mt-6 border border-[var(--jevo-line)] p-4"><p className="protocol-label">Next state</p><p className="mt-3 font-mono text-[0.63rem] leading-6 tracking-[0.07em] text-[var(--jevo-text)] uppercase">Pairing validation → contract preparation → final policy check → guardian approval → controlled execution</p></div><Link href={`/pairing/${pairing.slug}`} className="mt-6 flex items-center justify-between border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-4 py-3 font-mono text-[0.63rem] tracking-[0.08em] text-[#080a07] uppercase transition-colors hover:bg-transparent hover:text-[var(--jevo-accent)]"><span>Review launch candidate</span><span aria-hidden="true">↗</span></Link><Link href="/pairing" className="mt-4 block font-mono text-[0.61rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-accent)]">Back to pairing marketplace ←</Link></div></section>;
}
