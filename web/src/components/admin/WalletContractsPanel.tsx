"use client";

import Link from "next/link";
import { PanelHead } from "@/components/admin/OverviewPanel";
import { useAgentStore } from "@/store/agent-store";
import { isJevoDemoMode } from "@/lib/api/client";
import { useEmergencyPauseLaunch } from "@/lib/api/admin-hooks";
import { getDeploymentSummary, getValidatedDeployments } from "@/lib/deployments";
import type { Launch } from "@/types/launch";

interface WalletContractsPanelProps {
  launch?: Launch | null;
}

export function WalletContractsPanel({ launch }: WalletContractsPanelProps) {
  const setAdminControlNotice = useAgentStore((state) => state.setAdminControlNotice);
  const emergencyPause = useEmergencyPauseLaunch();
  const demo = isJevoDemoMode();
  const summary = getDeploymentSummary();
  const deployments = getValidatedDeployments();

  const pause = async () => {
    if (demo) {
      setAdminControlNotice("Demo mode: emergency pause is disabled and no canonical launch state was changed.");
      return;
    }
    if (!launch) {
      setAdminControlNotice("No active launch to pause.");
      return;
    }
    try {
      await emergencyPause.mutateAsync(launch.cycleId);
      setAdminControlNotice("Emergency pause submitted to the worker.");
    } catch (error) {
      setAdminControlNotice(`Emergency pause failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  };

  return (
    <div>
      <PanelHead
        title="Wallet & contracts"
        meta={demo ? "Demo execution surface / non-canonical" : "Restricted execution surface / Phase 0"}
      />

      {/* (a) Registry Summary + Open Contracts Link */}
      <section className="border-b border-[var(--jevo-line)] bg-[var(--jevo-panel)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="protocol-label">Robinhood Chain Registry</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.06em]">
              On-Chain Contracts: <span className="text-[var(--jevo-accent)]">{summary}</span>
            </h2>
            <p className="mt-2 text-sm text-[var(--jevo-muted)]">
              {deployments.length === 0
                ? "No smart contracts are registered on testnet or mainnet in Phase 0."
                : `${deployments.length} smart contract(s) registered in the canonical deployments registry.`}
            </p>
          </div>
          <Link
            href="/contracts"
            className="inline-flex h-10 items-center justify-center border border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] px-4 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--jevo-accent)] transition-colors hover:bg-[var(--jevo-accent)] hover:text-[#0b0d0b]"
          >
            Open Contracts ↗
          </Link>
        </div>
      </section>

      {/* (b) Mode produksi tanpa data wallet kanonik: "No agent wallet configured (Phase 0)" */}
      {!demo ? (
        <section className="grid border-b border-[var(--jevo-line)] md:grid-cols-2">
          <div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0">
            <p className="protocol-label">Agent Wallet / Phase 0</p>
            <h2 className="mt-4 font-mono text-2xl tracking-tight text-[var(--jevo-muted)]">
              No agent wallet configured (Phase 0)
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">
              Autonomous wallet signing is deferred until market ranking and pairing curation are fully verified. No private key or autonomous signing identity exists in this environment.
            </p>
            <dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase">
              <WalletFact label="Network" value="Robinhood Chain (Target)" />
              <WalletFact label="Wallet Status" value="NOT CONFIGURED" />
              <WalletFact label="Signing Authority" value="None (Phase 0)" />
              <WalletFact label="Arbitrary transfers" value="Blocked" />
            </dl>
          </div>
          <div className="p-6">
            <p className="protocol-label">Execution policy</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.07em]">Restricted by design.</h2>
            <p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">
              In Phase 0, all agent actions end at human operator curation. No transaction execution or smart contract deployment is triggered by the worker.
            </p>
            <div className="mt-6 inline-block rounded border border-[var(--jevo-line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--jevo-dim)]">
              Phase 0 Guard Active · Autonomous Signing Disabled
            </div>
          </div>
        </section>
      ) : (
        /* (c) Mode demo: kartu placeholder boleh, tapi wajib badge "DEMO PLACEHOLDER · NOT A REAL ADDRESS" dan jangan pakai status "AUTHORIZED" */
        <section className="grid border-b border-[var(--jevo-line)] md:grid-cols-2">
          <div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <p className="protocol-label">{launch?.wallet.label ?? "Demo Agent Wallet"}</p>
              <span className="rounded border border-[rgb(255_122_92_/_40%)] bg-[rgb(255_122_92_/_12%)] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--jevo-danger)]">
                DEMO PLACEHOLDER · NOT A REAL ADDRESS
              </span>
            </div>
            <h2 className="mt-4 font-mono text-2xl tracking-[-0.08em]">
              {launch?.wallet.displayAddress ?? "0x0000...0000"}
            </h2>
            <dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase">
              <WalletFact label="Network" value={launch?.wallet.network ?? "Robinhood Chain"} />
              <WalletFact label="Permission" value={launch?.wallet.permission ?? "Launch Executor"} />
              <WalletFact label="Status" value="DEMO PLACEHOLDER (NOT REAL)" />
              <WalletFact label="Arbitrary transfers" value="Blocked" />
              <WalletFact label="Arbitrary contract calls" value="Blocked" />
              <WalletFact label="Emergency pause" value={launch?.wallet.emergencyPause ?? "Active"} />
            </dl>
          </div>
          <div className="p-6">
            <p className="protocol-label">Execution policy</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.07em]">Restricted by contract and guardian policy.</h2>
            <p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">
              The agent is limited to approved launch execution. Treasury withdrawal, ownership changes, arbitrary transfers, and arbitrary calls are not permitted.
            </p>
            <button
              type="button"
              onClick={() => void pause()}
              disabled={emergencyPause.isPending}
              className="mt-6 h-10 border border-[rgb(255_105_95_/_30%)] px-3 font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-danger)] uppercase"
            >
              Emergency pause / demo disabled
            </button>
          </div>
        </section>
      )}

      {/* Contracts display */}
      <section>
        <PanelHead title="Contracts" meta="Registry & reference states" />
        {demo && launch?.contracts ? (
          <div className="grid border-l border-[var(--jevo-line)] md:grid-cols-2">
            {launch.contracts.map((contract) => (
              <article key={contract.label} className="min-h-40 border-r border-b border-[var(--jevo-line)] p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="protocol-label">{contract.label}</p>
                  <span className="rounded border border-[rgb(255_122_92_/_40%)] bg-[rgb(255_122_92_/_12%)] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--jevo-danger)]">
                    DEMO PLACEHOLDER · NOT A REAL ADDRESS
                  </span>
                </div>
                <p className="mt-4 font-mono text-xl tracking-[-0.07em] text-[var(--jevo-text)]">
                  {contract.displayAddress}
                </p>
                <p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">
                  {contract.referenceState}. Simulated address in demo mode.
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-[var(--jevo-muted)]">
            <p>
              Smart contract addresses are managed exclusively in the registry. Open the{" "}
              <Link href="/contracts" className="text-[var(--jevo-accent)] underline">
                Contracts page
              </Link>{" "}
              to inspect registered testnet and mainnet deployments.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function WalletFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[var(--jevo-muted)]">{label}</dt>
      <dd className="max-w-64 text-right text-[var(--jevo-text)]">{value}</dd>
    </div>
  );
}
