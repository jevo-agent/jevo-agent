"use client";

import { PanelHead } from "@/components/admin/OverviewPanel";
import { useAgentStore } from "@/store/agent-store";
import { isJevoDemoMode } from "@/lib/api/client";
import { useEmergencyPauseLaunch } from "@/lib/api/admin-hooks";
import type { Launch } from "@/types/launch";

interface WalletContractsPanelProps { launch: Launch; }

export function WalletContractsPanel({ launch }: WalletContractsPanelProps) {
  const setAdminControlNotice = useAgentStore((state) => state.setAdminControlNotice);
  const emergencyPause = useEmergencyPauseLaunch();
  const demo = isJevoDemoMode();
  const { wallet } = launch;
  const pause = async () => {
    if (demo) { setAdminControlNotice("Demo mode: emergency pause is disabled and no canonical launch state was changed."); return; }
    try { await emergencyPause.mutateAsync(launch.cycleId); setAdminControlNotice("Emergency pause submitted to the worker."); }
    catch (error) { setAdminControlNotice(`Emergency pause failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  return <div><PanelHead title="Wallet & contracts" meta="Restricted execution surface" /><section className="grid border-b border-[var(--jevo-line)] md:grid-cols-2"><div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0"><p className="protocol-label">{wallet.label}</p><h2 className="mt-4 font-mono text-3xl tracking-[-0.08em]">{wallet.displayAddress}</h2><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase"><WalletFact label="Network" value={wallet.network} /><WalletFact label="Permission" value={wallet.permission} /><WalletFact label="Status" value={wallet.status} /><WalletFact label="Arbitrary transfers" value="Blocked" /><WalletFact label="Arbitrary contract calls" value="Blocked" /><WalletFact label="Emergency pause" value={wallet.emergencyPause} /></dl></div><div className="p-6"><p className="protocol-label">Execution policy</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.07em]">Restricted by contract and guardian policy.</h2><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">The agent is limited to approved launch execution. Treasury withdrawal, ownership changes, arbitrary transfers, and arbitrary calls are not permitted.</p><button type="button" onClick={() => void pause()} disabled={emergencyPause.isPending} className="mt-6 h-10 border border-[rgb(255_105_95_/_30%)] px-3 font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-danger)] uppercase">{demo ? "Emergency pause / demo disabled" : "Emergency pause"}</button></div></section><section><PanelHead title="Contracts" meta="Phase 0 reference addresses" /><div className="grid border-l border-[var(--jevo-line)] md:grid-cols-2">{launch.contracts.map((contract) => <article key={contract.label} className="min-h-40 border-r border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">{contract.label}</p><p className="mt-4 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]">{contract.displayAddress}</p><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{contract.referenceState}. Not deployed or connected in Phase 0.</p></article>)}</div></section></div>;
}

function WalletFact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-52 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
