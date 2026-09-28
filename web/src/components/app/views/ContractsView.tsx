"use client";

import { useMemo, useState } from "react";

import {
  EXPLORER_BASE,
  PLANNED_CONTRACTS,
  STATIC_CONTRACTS_DISCLAIMER,
  getDeploymentsByNetwork,
  getDeploymentSummary,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  type NetworkType,
} from "@/lib/deployments";

interface ContractsViewProps {
  customDeployments?: unknown[];
}

export function ContractsView({ customDeployments }: ContractsViewProps) {
  const [activeTab, setActiveTab] = useState<NetworkType>("testnet");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const testnetDeployments = useMemo(
    () => getDeploymentsByNetwork("testnet", customDeployments ? { deployments: customDeployments } : undefined),
    [customDeployments],
  );

  const mainnetDeployments = useMemo(
    () => getDeploymentsByNetwork("mainnet", customDeployments ? { deployments: customDeployments } : undefined),
    [customDeployments],
  );

  const currentDeployments = activeTab === "testnet" ? testnetDeployments : mainnetDeployments;
  const currentChainId = activeTab === "testnet" ? 46630 : 4663;
  const summary = useMemo(() => getDeploymentSummary([...testnetDeployments, ...mainnetDeployments]), [testnetDeployments, mainnetDeployments]);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    }
  };

  return (
    <div className="contracts-view">
      {/* 01. App Hero */}
      <section className="app-hero">
        <div className="eyebrow">
          <span className="live-dot" />
          <span className="label">
            Robinhood Chain · On-Chain Registry · <b>{summary}</b>
          </span>
        </div>
        <h1>
          Registered <span className="hl">Contracts</span>
        </h1>
        <p>
          Canonical smart contracts registered for JEVO on Robinhood Chain. All addresses are public records on-chain.
        </p>
      </section>

      {/* 02. Static Public Records Disclaimer */}
      <aside className="mb-6 rounded border border-[var(--line-strong)] bg-[rgb(14_17_15_/_70%)] p-4" aria-label="Contracts disclaimer">
        <div className="flex items-start gap-3">
          <span className="font-mono text-xs font-bold text-[var(--accent)]">NOTICE</span>
          <p className="font-mono text-xs leading-relaxed text-[var(--text-2)]">
            {STATIC_CONTRACTS_DISCLAIMER}
          </p>
        </div>
      </aside>

      {/* 03. Network Tabs (Chain ID as network fact) */}
      <div className="panel mb-8">
        <div className="tabs" role="tablist" aria-label="Contract networks">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "testnet"}
            aria-controls="panel-testnet"
            id="tab-testnet"
            onClick={() => setActiveTab("testnet")}
          >
            TESTNET <span className="text-[var(--dim)] font-mono ml-1.5">(Chain ID: 46630)</span>
            <span className="ml-2 font-mono text-[9px] text-[var(--accent)]">[{testnetDeployments.length}]</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "mainnet"}
            aria-controls="panel-mainnet"
            id="tab-mainnet"
            onClick={() => setActiveTab("mainnet")}
          >
            MAINNET <span className="text-[var(--dim)] font-mono ml-1.5">(Chain ID: 4663)</span>
            <span className="ml-2 font-mono text-[9px] text-[var(--accent)]">[{mainnetDeployments.length}]</span>
          </button>
        </div>

        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="tabpanel active p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <span className="label">Active Environment</span>
              <p className="font-mono text-sm font-semibold uppercase text-[var(--text)]">
                {activeTab} · Chain ID {currentChainId}
              </p>
            </div>
            <div>
              <span className="label">Explorer Base</span>
              <a
                href={EXPLORER_BASE[activeTab]}
                target="_blank"
                rel="noreferrer"
                className="block font-mono text-xs text-[var(--accent)] hover:underline"
              >
                {EXPLORER_BASE[activeTab]} ↗
              </a>
            </div>
          </div>

          {currentDeployments.length === 0 ? (
            <div className="rounded border border-dashed border-[var(--line)] p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--dim)]">
                Registry Empty
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                No contracts registered on {activeTab} yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {currentDeployments.map((entry) => {
                const addressKey = `${entry.network}-${entry.address}`;
                const isCopied = copiedKey === addressKey;
                return (
                  <article
                    key={addressKey}
                    className="flex flex-col justify-between rounded border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--line-strong)]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{entry.name}</h2>
                        <span className="rounded border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)] uppercase">
                          {entry.network}
                        </span>
                      </div>

                      {entry.note ? (
                        <p className="mt-2 text-xs text-[var(--muted)]">{entry.note}</p>
                      ) : null}

                      {/* Full Address + Copy */}
                      <div className="mt-4 rounded border border-[var(--line)] bg-[var(--bg)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="label">Contract Address</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(entry.address, addressKey)}
                            className="font-mono text-[11px] text-[var(--accent)] hover:underline"
                            aria-label={`Copy address for ${entry.name}`}
                          >
                            {isCopied ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-1 break-all font-mono text-xs text-[var(--text)]">{entry.address}</p>
                        <div className="mt-2 flex items-center justify-end">
                          <a
                            href={getExplorerAddressUrl(entry.network, entry.address)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-[var(--accent)] hover:underline"
                          >
                            View on Explorer ↗
                          </a>
                        </div>
                      </div>

                      {/* Optional Transaction Hash */}
                      {entry.txHash ? (
                        <div className="mt-3 text-xs">
                          <span className="label">Deployment Tx: </span>
                          <a
                            href={getExplorerTxUrl(entry.network, entry.txHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-[var(--text-2)] hover:underline"
                          >
                            {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)} ↗
                          </a>
                        </div>
                      ) : null}

                      {/* Optional Metadata */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--dim)]">
                        {entry.deployedAt ? (
                          <span>Deployed: {new Date(entry.deployedAt).toLocaleDateString()}</span>
                        ) : null}
                        {entry.deployer ? (
                          <span>Deployer: {entry.deployer.slice(0, 6)}...{entry.deployer.slice(-4)}</span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 04. Planned · Not Deployed Block */}
      <section className="panel p-6" aria-labelledby="planned-contracts-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-4">
          <div>
            <span className="label">Architecture Pipeline</span>
            <h2 id="planned-contracts-title" className="text-xl font-bold uppercase tracking-tight text-[var(--text)]">
              Planned · Not Deployed
            </h2>
          </div>
          <span className="rounded border border-[var(--line-strong)] bg-[rgb(255_122_92_/_12%)] px-2.5 py-1 font-mono text-[10px] tracking-wider text-[var(--down)] uppercase">
            Phase 0 · Deferred Blockchain Phase
          </span>
        </div>

        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--text-2)]">
          The following contracts form the planned protocol execution architecture from{" "}
          <span className="font-mono text-xs text-[var(--text)]">docs/BRIEF.md §23</span> and{" "}
          <span className="font-mono text-xs text-[var(--text)]">docs/BackendHandoff.md §21</span>. Autonomous execution, agent signing, and token factory deployment remain deferred until Phase 0 autonomous market intelligence is fully verified.
        </p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PLANNED_CONTRACTS.map((contract) => (
            <div
              key={contract.name}
              className="flex flex-col justify-between rounded border border-[var(--line)] bg-[var(--panel)] p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text)] text-sm">{contract.name}</h3>
                  <span className="rounded border border-[var(--line-strong)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--dim)] uppercase">
                    Unassigned
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{contract.purpose}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 font-mono text-[10px]">
                <span className="text-[var(--dim)]">{contract.sourceDoc}</span>
                <span className="text-[var(--down)]">{contract.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
