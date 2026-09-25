import type { Launch } from "@/types/launch";

interface AgentWalletStateProps { launch: Launch; }

export function AgentWalletState({ launch }: AgentWalletStateProps) {
  const { wallet } = launch;
  return <section aria-labelledby="agent-wallet-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="agent-wallet-title" className="protocol-label">{wallet.label}</h2><p className="protocol-label">Restricted executor</p></div><div className="p-5"><p className="font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]">JEVO AGENT</p><p className="mt-3 font-mono text-sm text-[var(--jevo-muted)]">{wallet.displayAddress}</p><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase"><WalletFact label="Network" value={wallet.network} /><WalletFact label="Permission" value={wallet.permission} /><WalletFact label="Status" value={wallet.status} /><WalletFact label="Emergency pause" value={wallet.emergencyPause} /></dl><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">Allowed scope: approved launch execution only. Arbitrary transfers, arbitrary contract calls, treasury withdrawal, and ownership changes are not permitted.</p></div></section>;
}

function WalletFact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-42 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
