"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EXPLORER_BASE, PLANNED_CONTRACTS, getValidatedDeployments } from "@/lib/deployments";
import rawDeps from "@/data/onchain-dependencies.json";

/* -------------------------------------------------------------------------
   Types
   ----------------------------------------------------------------------- */
interface MonitoredEntry {
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  network: string;
  note: string;
}

type CheckStatus = "ON-CHAIN" | "SOURCE VERIFIED" | "NOT FOUND" | "CHECK UNAVAILABLE" | "LOADING";

interface CheckResult {
  address: string;
  status: CheckStatus;
}

type TabId = "deployed" | "monitored" | "planned";

/* -------------------------------------------------------------------------
   Validation (same rules as deployments.ts)
   ----------------------------------------------------------------------- */
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function shortenAddr(addr: string): string {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function getStatusBadgeClass(status: CheckStatus): string {
  if (status === "SOURCE VERIFIED") return "badge-verified";
  if (status === "ON-CHAIN") return "badge-onchain";
  if (status === "NOT FOUND") return "badge-notfound";
  if (status === "LOADING") return "badge-loading";
  return "badge-unavail";
}

function getStatusLabel(status: CheckStatus): string {
  if (status === "LOADING") return "CHECKING...";
  return status;
}

/* -------------------------------------------------------------------------
   Clipboard helper
   ----------------------------------------------------------------------- */
async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* fall through to execCommand */
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "true");
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/* -------------------------------------------------------------------------
   Single-row component
   ----------------------------------------------------------------------- */
interface ContractRowProps {
  name: string;
  symbol?: string;
  address: string;
  note?: string | null;
  explorerBase: string;
  checkResult: CheckResult | undefined;
  isWide: boolean; // >= 1024px → show full address
}

function ContractRow({
  name,
  symbol,
  address,
  note,
  explorerBase,
  checkResult,
  isWide,
}: ContractRowProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(address);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [address]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const status = checkResult?.status ?? "LOADING";
  const explorerUrl = `${explorerBase}/address/${address}`;

  return (
    <div className="cview-row" role="row">
      {/* Status dot */}
      <div className="cview-dot-col" role="cell" aria-label="Status">
        <span
          className={`cview-status-dot ${
            status === "SOURCE VERIFIED" || status === "ON-CHAIN"
              ? "dot-live"
              : status === "LOADING"
              ? "dot-loading"
              : "dot-off"
          }`}
        />
      </div>

      {/* Name + symbol */}
      <div className="cview-name-col" role="cell">
        <span className="cview-name">{name}</span>
        {symbol ? <span className="cview-symbol">{symbol}</span> : null}
        {note ? <span className="cview-note">{note}</span> : null}
      </div>

      {/* Address */}
      <div className="cview-addr-col" role="cell">
        <code
          className="cview-addr-code"
          title={address}
          aria-label={`Contract address: ${address}`}
        >
          {isWide ? address : shortenAddr(address)}
        </code>
      </div>

      {/* Actions */}
      <div className="cview-actions-col" role="cell">
        <button
          type="button"
          className={`cview-copy-btn${copied ? " is-copied" : ""}`}
          onClick={() => void handleCopy()}
          aria-label={`Copy address for ${name}`}
          title={copied ? "Copied!" : "Copy address"}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cview-explorer-btn"
          aria-label={`View ${name} on explorer (opens in new tab)`}
          title="View on explorer"
        >
          ↗
        </a>
      </div>

      {/* Explorer check badge */}
      <div className="cview-badge-col" role="cell">
        {status === "LOADING" ? (
          <span className={`cview-check-badge ${getStatusBadgeClass(status)}`}>
            <span className="badge-skeleton" aria-hidden="true" />
            <span className="sr-only">Checking explorer...</span>
          </span>
        ) : (
          <span
            className={`cview-check-badge ${getStatusBadgeClass(status)}`}
            title={`Explorer check: ${status}`}
            aria-label={`Explorer check result: ${status}`}
          >
            {getStatusLabel(status)}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Main ContractsView
   ----------------------------------------------------------------------- */
export function ContractsView() {
  const [activeTab, setActiveTab] = useState<TabId>("deployed");
  const [search, setSearch] = useState("");
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isWide, setIsWide] = useState(false);

  /* Validated deployments (JEVO DEPLOYED) */
  const deployments = useMemo(() => getValidatedDeployments(), []);

  /* Validated monitored entries */
  const monitoredRaw = (rawDeps as { monitored: MonitoredEntry[] }).monitored;
  const monitored = useMemo(
    () => monitoredRaw.filter((e) => ADDRESS_RE.test(e.address)),
    [monitoredRaw],
  );

  /* Counts for tab labels */
  const plannedCount = PLANNED_CONTRACTS.length;

  /* Width tracking for address display */
  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* --- Explorer checks (fire once on mount, per-address) --- */
  useEffect(() => {
    const allAddresses: Array<{ address: string; network: string }> = [
      ...deployments.map((d) => ({ address: d.address, network: d.network })),
      ...monitored.map((m) => ({ address: m.address, network: m.network })),
    ];

    // Initialize as LOADING (use updater to avoid synchronous overwrite)
    queueMicrotask(() => {
      setChecks(allAddresses.map(({ address }) => ({ address, status: "LOADING" as CheckStatus })));
    });

    // Fetch each address individually
    const fetchCheck = async (address: string, network: string) => {
      try {
        const res = await fetch(
          `/api/contracts/check?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`,
        );
        if (!res.ok) {
          setChecks((prev) =>
            prev.map((c) => (c.address === address ? { address, status: "CHECK UNAVAILABLE" as CheckStatus } : c)),
          );
          return;
        }
        const data = (await res.json()) as { status: CheckStatus };
        setChecks((prev) =>
          prev.map((c) =>
            c.address === address ? { address, status: data.status ?? ("CHECK UNAVAILABLE" as CheckStatus) } : c,
          ),
        );
      } catch {
        setChecks((prev) =>
          prev.map((c) => (c.address === address ? { address, status: "CHECK UNAVAILABLE" as CheckStatus } : c)),
        );
      }
    };

    for (const { address, network } of allAddresses) {
      void fetchCheck(address, network);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Search filter helpers --- */
  const q = search.trim().toLowerCase();

  const filteredDeployed = useMemo(
    () =>
      q
        ? deployments.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.address.toLowerCase().includes(q) ||
              d.network.toLowerCase().includes(q),
          )
        : deployments,
    [deployments, q],
  );

  const filteredMonitored = useMemo(
    () =>
      q
        ? monitored.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.symbol.toLowerCase().includes(q) ||
              m.address.toLowerCase().includes(q),
          )
        : monitored,
    [monitored, q],
  );

  const filteredPlanned = useMemo(
    () =>
      q
        ? PLANNED_CONTRACTS.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.purpose.toLowerCase().includes(q),
          )
        : PLANNED_CONTRACTS,
    [q],
  );

  /* --- Explorer check summary for header --- */
  const allChecks = useMemo(
    () => [...deployments.map((d) => d.address), ...monitored.map((m) => m.address)],
    [deployments, monitored],
  );

  const checkSummary = useMemo(() => {
    if (allChecks.length === 0) return null;
    const total = allChecks.length;
    const results = allChecks.map((addr) => checks.find((c) => c.address === addr));
    const loading = results.some((r) => !r || r.status === "LOADING");
    if (loading) return null;
    const onchain = results.filter(
      (r) => r?.status === "ON-CHAIN" || r?.status === "SOURCE VERIFIED",
    ).length;
    if (onchain === total) return { label: `EXPLORER CHECK: ${onchain}/${total} ON-CHAIN`, variant: "ok" };
    if (onchain === 0) return { label: "CHECK UNAVAILABLE", variant: "unavail" };
    return { label: `CHECK PARTIAL: ${onchain}/${total} ON-CHAIN`, variant: "partial" };
  }, [allChecks, checks]);

  return (
    <div className="cview-root">
      {/* === Header === */}
      <section className="cview-header">
        <div className="cview-header-left">
          <div className="eyebrow">
            <span className="live-dot" />
            <span className="label">
              CONTRACT REGISTRY · ROBINHOOD CHAIN
            </span>
          </div>
          <h1 className="cview-h1">
            Contract <span className="hl">Registry</span>
          </h1>
          <p className="cview-lead">
            Smart contracts JEVO reads or deploys on Robinhood Chain. All
            addresses are public records. Verify each on the explorer.
          </p>
        </div>
        {checkSummary ? (
          <div
            className={`cview-check-summary cview-check-summary--${checkSummary.variant}`}
            aria-label={`Explorer check summary: ${checkSummary.label}`}
          >
            {checkSummary.label}
          </div>
        ) : null}
      </section>

      {/* === Notice === */}
      <aside className="cview-notice" aria-label="Contracts notice">
        <span className="cview-notice-tag">NOTICE</span>
        <p>
          Address mapping maintained by the JEVO team. Verify each on the
          explorer before relying on them. Contracts are not audited.
        </p>
      </aside>

      {/* === Search + Tabs === */}
      <div className="cview-toolbar">
        <div
          className="tabs"
          role="tablist"
          aria-label="Contract categories"
        >
          <button
            type="button"
            id="tab-deployed"
            role="tab"
            className={activeTab === "deployed" ? "is-active" : ""}
            aria-selected={activeTab === "deployed"}
            aria-controls="panel-deployed"
            onClick={() => setActiveTab("deployed")}
          >
            JEVO DEPLOYED
            <span className="tab-count">{deployments.length}</span>
          </button>
          <button
            type="button"
            id="tab-monitored"
            role="tab"
            className={activeTab === "monitored" ? "is-active" : ""}
            aria-selected={activeTab === "monitored"}
            aria-controls="panel-monitored"
            onClick={() => setActiveTab("monitored")}
          >
            MONITORED STOCK TOKENS
            <span className="tab-count">{monitored.length}</span>
          </button>
          <button
            type="button"
            id="tab-planned"
            role="tab"
            className={activeTab === "planned" ? "is-active" : ""}
            aria-selected={activeTab === "planned"}
            aria-controls="panel-planned"
            onClick={() => setActiveTab("planned")}
          >
            PLANNED
            <span className="tab-count">{plannedCount}</span>
          </button>
        </div>

        <div className="cview-search-wrap">
          <label htmlFor="cview-search" className="sr-only">
            Search contracts
          </label>
          <input
            id="cview-search"
            type="search"
            className="cview-search"
            placeholder="Search name, symbol, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contracts"
          />
          {search ? (
            <button
              type="button"
              className="cview-search-clear"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {/* === Tab: JEVO DEPLOYED === */}
      <div
        id="panel-deployed"
        role="tabpanel"
        aria-labelledby="tab-deployed"
        hidden={activeTab !== "deployed"}
        className="cview-panel"
      >
        <div className="cview-meta-bar">
          <span className="cview-meta-item">
            <span className="cview-meta-label">NETWORK</span>
            <b>Mainnet + Testnet</b>
          </span>
          <span className="cview-meta-item">
            <span className="cview-meta-label">CHAIN ID</span>
            <b>4663 (mainnet) / 46630 (testnet)</b>
          </span>
          <span className="cview-meta-item">
            <span className="cview-meta-label">EXPLORER</span>
            <a
              href={EXPLORER_BASE.mainnet}
              target="_blank"
              rel="noopener noreferrer"
              className="cview-explorer-link"
            >
              {EXPLORER_BASE.mainnet} ↗
            </a>
          </span>
        </div>

        {deployments.length === 0 ? (
          <div className="cview-empty">
            <span className="cview-empty-code">NO JEVO CONTRACTS REGISTERED YET.</span>
            <p>
              The JEVO deployment registry (
              <code>web/src/data/deployments.json</code>) is currently
              empty. Addresses will appear here once JEVO contracts are
              deployed and manually registered.
            </p>
          </div>
        ) : filteredDeployed.length === 0 ? (
          <div className="cview-empty">
            <span className="cview-empty-code">NO RESULTS</span>
            <p>No JEVO deployed contracts match &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          <div className="cview-table" role="table" aria-label="JEVO deployed contracts">
            <div className="cview-head" role="row">
              <div role="columnheader" className="cview-dot-col" />
              <div role="columnheader" className="cview-name-col">NAME</div>
              <div role="columnheader" className="cview-addr-col">ADDRESS</div>
              <div role="columnheader" className="cview-actions-col" />
              <div role="columnheader" className="cview-badge-col">EXPLORER CHECK</div>
            </div>
            {filteredDeployed.map((d) => (
              <ContractRow
                key={d.address}
                name={d.name}
                address={d.address}
                note={d.note}
                explorerBase={EXPLORER_BASE[d.network]}
                checkResult={checks.find((c) => c.address === d.address)}
                isWide={isWide}
              />
            ))}
          </div>
        )}
      </div>

      {/* === Tab: MONITORED STOCK TOKENS === */}
      <div
        id="panel-monitored"
        role="tabpanel"
        aria-labelledby="tab-monitored"
        hidden={activeTab !== "monitored"}
        className="cview-panel"
      >
        <div className="cview-monitored-notice">
          <b>Stock Token contracts on Robinhood Chain Mainnet that JEVO reads. Read-only. Not deployed by JEVO.</b>
          <p>Address mapping maintained by the JEVO team. Verify each on the explorer.</p>
        </div>

        <div className="cview-meta-bar">
          <span className="cview-meta-item">
            <span className="cview-meta-label">NETWORK</span>
            <b>Mainnet</b>
          </span>
          <span className="cview-meta-item">
            <span className="cview-meta-label">CHAIN ID</span>
            <b>4663</b>
          </span>
          <span className="cview-meta-item">
            <span className="cview-meta-label">EXPLORER</span>
            <a
              href={EXPLORER_BASE.mainnet}
              target="_blank"
              rel="noopener noreferrer"
              className="cview-explorer-link"
            >
              {EXPLORER_BASE.mainnet} ↗
            </a>
          </span>
        </div>

        {filteredMonitored.length === 0 ? (
          <div className="cview-empty">
            <span className="cview-empty-code">NO RESULTS</span>
            <p>No monitored tokens match &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          <div className="cview-table" role="table" aria-label="Monitored stock tokens">
            <div className="cview-head" role="row">
              <div role="columnheader" className="cview-dot-col" />
              <div role="columnheader" className="cview-name-col">NAME / SYMBOL</div>
              <div role="columnheader" className="cview-addr-col">ADDRESS</div>
              <div role="columnheader" className="cview-actions-col" />
              <div role="columnheader" className="cview-badge-col">EXPLORER CHECK</div>
            </div>
            {filteredMonitored.map((m) => (
              <ContractRow
                key={m.address}
                name={m.name}
                symbol={m.symbol}
                address={m.address}
                note={m.note}
                explorerBase={EXPLORER_BASE.mainnet}
                checkResult={checks.find((c) => c.address === m.address)}
                isWide={isWide}
              />
            ))}
          </div>
        )}
      </div>

      {/* === Tab: PLANNED === */}
      <div
        id="panel-planned"
        role="tabpanel"
        aria-labelledby="tab-planned"
        hidden={activeTab !== "planned"}
        className="cview-panel"
      >
        <div className="cview-meta-bar">
          <span className="cview-meta-item">
            <span className="cview-meta-label">STATUS</span>
            <b>Phase 0 · Deferred</b>
          </span>
          <span className="cview-meta-item">
            <span className="cview-meta-label">DOCS</span>
            <b>BRIEF.md §23, BackendHandoff §21</b>
          </span>
        </div>

        <p className="cview-planned-lead">
          The following contracts form the planned protocol execution
          architecture. Autonomous execution, agent signing, and token
          factory deployment remain deferred until Phase 0 autonomous market
          intelligence is fully verified.
        </p>

        {filteredPlanned.length === 0 ? (
          <div className="cview-empty">
            <span className="cview-empty-code">NO RESULTS</span>
            <p>No planned contracts match &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          <div className="cview-planned-grid">
            {filteredPlanned.map((p) => (
              <div key={p.name} className="cview-planned-card">
                <div className="cview-planned-head">
                  <span className="cview-planned-name">{p.name}</span>
                  <span className="cview-planned-badge">UNASSIGNED</span>
                </div>
                <p className="cview-planned-desc">{p.purpose}</p>
                <div className="cview-planned-footer">
                  <span>{p.sourceDoc}</span>
                  <span className="cview-planned-status">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
