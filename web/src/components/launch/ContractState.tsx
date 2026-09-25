import type { Launch } from "@/types/launch";

interface ContractStateProps { launch: Launch; }

export function ContractState({ launch }: ContractStateProps) {
  return <section aria-labelledby="contract-state-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="contract-state-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Contract state</h2><p className="protocol-label">Pending execution</p></div><div className="p-5"><p className="mb-4 text-sm leading-6 text-[var(--jevo-muted)]">Display-only Phase 0 references. These placeholders are not presented as deployed contracts.</p><dl className="divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)]">{launch.contracts.map((contract) => <div key={contract.label} className="py-4"><dt className="font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{contract.label}</dt><dd className="mt-2 flex flex-wrap items-center justify-between gap-3 font-mono text-sm text-[var(--jevo-text)]"><span>{contract.displayAddress}</span><span className="text-[0.55rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{contract.referenceState}</span></dd></div>)}</dl></div></section>;
}
