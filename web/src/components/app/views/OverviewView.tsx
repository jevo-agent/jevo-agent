"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { formatClock, formatCountdown, formatCycle } from "@/lib/format";
import { useOpportunities } from "@/lib/api/hooks";
import { adaptOpportunity, type OpportunityApi } from "@/lib/api/adapters";
import type { AgentEvent, AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface OverviewViewProps {
  agent: AgentRuntime;
  assets: Stock[];
  ranking: string[];
  pairings: Pairing[];
  launch?: Launch | null;
  memory: MemoryRecord[];
  featuredPairing?: Pairing | null;
}

type DecisionFilter = "all" | "PROMOTE" | "DEMOTE";
type SortKey = "rank" | "score" | "delta";
type OverviewTab = "rank" | "trace";

type TraceEntry = {
  id: string;
  timestamp: string;
  type: string;
  subject: string;
  previousState: string;
  currentState: string;
  decision: string;
  summary: string;
};

export function OverviewView({
  agent,
  assets,
  ranking,
  pairings,
  launch,
  memory,
  featuredPairing,
}: OverviewViewProps) {
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<DecisionFilter>("all");
  const [sort, setSort] = useState<SortKey>("rank");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  // The workspace owns the rank/trace controls; the full Opportunity Field
  // lives once below it as the canonical visual surface.
  const [overviewTab, setOverviewTab] = useState<OverviewTab>("rank");

  const oppsQuery = useOpportunities();
  const oppsMap = useMemo(() => {
    return new Map((oppsQuery.data?.data ?? []).map((item) => [item.symbol, item]));
  }, [oppsQuery.data?.data]);

  // Merge dynamic opportunityScore & rank from useOpportunities() hook so that
  // ranking table and chart read the EXACT same data source without drift
  const mergedAssets = useMemo(() => {
    return assets.map((asset) => {
      const opp = oppsMap.get(asset.symbol);
      if (!opp) return asset;
      return adaptOpportunity(opp);
    });
  }, [assets, oppsMap]);

  const ordered = useMemo(
    () => ranking.map((symbol) => mergedAssets.find((asset) => asset.symbol === symbol)).filter((asset): asset is Stock => Boolean(asset)),
    [mergedAssets, ranking],
  );

  const rows = useMemo(() => {
    return ordered
      .filter((asset) => {
        const matchesQuery = !query || `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.toLowerCase());
        const matchesDecision =
          decision === "all" || (decision === "PROMOTE" ? asset.jevDecision === "PROMOTE" : asset.rankMovement !== null && asset.rankMovement < 0);
        return matchesQuery && matchesDecision;
      })
      .sort((left, right) => {
        const leftValue = sort === "rank" ? left.currentRank : sort === "score" ? left.opportunityScore : left.rankMovement;
        const rightValue = sort === "rank" ? right.currentRank : sort === "score" ? right.opportunityScore : right.rankMovement;
        if (leftValue === null || rightValue === null) return 0;
        return (leftValue - rightValue) * direction;
      });
  }, [decision, direction, ordered, query, sort]);

  const selectedAsset = mergedAssets.find((asset) => asset.symbol === selectedSymbol) ?? ordered[0] ?? mergedAssets[0];
  const topOpportunity = ordered[0] ?? selectedAsset;
  const activeSymbol = hoveredSymbol ?? selectedSymbol;
  const inspectedAsset = mergedAssets.find((asset) => asset.symbol === activeSymbol) ?? selectedAsset;
  const inspectedPairing = inspectedAsset ? pairings.find((pairing) => pairing.stockSymbol === inspectedAsset.symbol) : undefined;
  const passedChecks = launch?.policyChecks?.filter((check) => check.status === "PASSED").length ?? 0;

  if (!selectedAsset || !inspectedAsset) return null;

  const selectSort = (value: SortKey) => {
    if (sort === value) setDirection((current) => (current === 1 ? -1 : 1));
    else {
      setSort(value);
      setDirection(value === "rank" ? 1 : -1);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setHoveredSymbol(null);
  };

  const handleResetSymbol = () => {
    setSelectedSymbol("NVDA");
    setHoveredSymbol(null);
  };

  return (
    <>
      {/* 01. OPERATIONAL SUMMARY BLOCK & LIVE PROTOCOL RAIL */}
      <section id="overview" className="app-section app-overview-section" aria-labelledby="app-overview-title">
        {/* Kicker */}
        <div className="app-section-kicker">
          <span className="label">
            <span className="live-dot" aria-hidden="true" /> ROBINHOOD CHAIN · AUTONOMOUS MARKET AGENT
          </span>
          <span className="label">
            CYCLE {agent.activeCycle} · JEV {agent.jevStatus}
          </span>
        </div>

        {/* Operating Context & Telemetry Block */}
        <div className="overview-context">
          <div className="overview-context-main">
            <h1 id="app-overview-title">
              AUTONOMOUS <span className="headline-accent">MARKET INTELLIGENCE</span>
              <br />
              IN MOTION.
            </h1>
            <p>
              JEV continuously evaluates Stock Tokens, ranks opportunities, advances qualified pairings, and records every state change.
            </p>
            <div className="overview-context-actions">
              <Link href={`/stock/${topOpportunity.symbol}`} className="overview-action-btn">
                INSPECT {topOpportunity.symbol} →
              </Link>
              <Link href="/pairing" className="overview-action-btn">
                OPEN PAIRING STATE →
              </Link>
            </div>
          </div>

          <div className="overview-operating-block" aria-label="Current agent operating state">
            <div className="operating-block-head">
              <span className="label">AUTONOMOUS OPERATING STATE</span>
              <span className="operating-live-tag">
                <i className="live-dot" aria-hidden="true" /> JEV {agent.jevStatus}
              </span>
            </div>
            <dl className="operating-telemetry-list">
              <div>
                <dt>CYCLE</dt>
                <dd>{formatCycle(agent.activeCycle)}</dd>
              </div>
              <div>
                <dt>SCAN</dt>
                <dd>{agent.currentOperation}</dd>
              </div>
              <div>
                <dt>CURRENT OPPORTUNITY</dt>
                <dd>
                  <b>{topOpportunity.symbol}</b> <small>#{String(topOpportunity.currentRank).padStart(2, "0")} / {topOpportunity.opportunityScore.toFixed(1)}</small>
                </dd>
              </div>
              <div>
                <dt>DECISION</dt>
                <dd>
                  <b className="accent">{topOpportunity.jevDecision.replaceAll("_", " ")}</b> <small>{topOpportunity.confidence === null ? "—" : `${topOpportunity.confidence}%`} CONFIDENCE</small>
                </dd>
              </div>
              <div>
                <dt>QUALIFIED PAIRING</dt>
                <dd>
                  {featuredPairing ? (
                    <>
                      <b>{featuredPairing.stockSymbol} × {featuredPairing.symbol}</b> <small className="accent">{featuredPairing.pairScore.toFixed(1)} / STRONG PAIR</small>
                    </>
                  ) : (
                    <b>NONE</b>
                  )}
                </dd>
              </div>
              <div>
                <dt>LAUNCH</dt>
                <dd>
                  {launch ? (
                    <>
                      <b>{launch.readiness}</b> <small>{launch.transactionState.replaceAll("_", " ")}</small>
                    </>
                  ) : (
                    <b>STANDBY</b>
                  )}
                </dd>
              </div>
              <div>
                <dt>SETTLEMENT</dt>
                <dd>{agent.networkLabel ? `${agent.networkLabel.toUpperCase()} · PHASE 0` : "UNAVAILABLE · PHASE 0"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Clean Summary Band */}
        <div className="overview-summary-band" aria-label="Current JEVO operating summary">
          <div className="summary-cell">
            <span className="label">TOP OPPORTUNITY</span>
            <strong className="summary-val">{topOpportunity.symbol}</strong>
            <small className="summary-sub">
              #{String(topOpportunity.currentRank).padStart(2, "0")} / {topOpportunity.opportunityScore.toFixed(1)}
            </small>
          </div>
          <div className="summary-cell">
            <span className="label">JEV DECISION</span>
            <strong className="summary-val accent">{topOpportunity.jevDecision.replaceAll("_", " ")}</strong>
            <small className="summary-sub">{topOpportunity.confidence === null ? "—" : `${topOpportunity.confidence}%`} CONFIDENCE</small>
          </div>
          <div className="summary-cell">
            <span className="label">PAIRING</span>
            {featuredPairing ? (
              <>
                <strong className="summary-val">
                  {featuredPairing.stockSymbol} × {featuredPairing.symbol}
                </strong>
                <small className="summary-sub accent">
                  {featuredPairing.pairScore.toFixed(1)} / STRONG PAIR
                </small>
              </>
            ) : (
              <>
                <strong className="summary-val">NONE</strong>
                <small className="summary-sub">NO ACTIVE PAIR</small>
              </>
            )}
          </div>
          <div className="summary-cell">
            <span className="label">LAUNCH</span>
            {launch ? (
              <>
                <strong className="summary-val">{launch.readiness}</strong>
                <small className="summary-sub">{launch.transactionState.replaceAll("_", " ")}</small>
              </>
            ) : (
              <>
                <strong className="summary-val">STANDBY</strong>
                <small className="summary-sub">NO ACTIVE LAUNCH</small>
              </>
            )}
          </div>
        </div>

        {/* Live Protocol Status Rail */}
        <div className="live-protocol-rail" aria-label="JEVO protocol operational rail">
          <div className="rail-track">
            <span className="rail-item live">
              <i className="live-dot" aria-hidden="true" /> JEV ACTIVE
            </span>
            <span className="rail-item">
              CYCLE <b>{formatCycle(agent.activeCycle)}</b>
            </span>
            <span className="rail-item">{agent.currentOperation}</span>
            <span className="rail-item highlight">
              {topOpportunity.symbol} <b>#{String(topOpportunity.currentRank).padStart(2, "0")}</b>
            </span>
            <span className="rail-item highlight">
              <b>{topOpportunity.jevDecision.replaceAll("_", " ")} {topOpportunity.confidence === null ? "—" : `${topOpportunity.confidence}%`}</b>
            </span>
            {featuredPairing ? (
              <span className="rail-item highlight">
                PAIR <b>{featuredPairing.stockSymbol} × {featuredPairing.symbol}</b> / STRONG PAIR
              </span>
            ) : (
              <span className="rail-item">
                PAIR <b>NONE</b>
              </span>
            )}
            {launch ? (
              <>
                <span className="rail-item">
                  LAUNCH <b>{launch.readiness}</b>
                </span>
                <span className="rail-item">
                  TX <b>{launch.transactionState.replaceAll("_", " ")}</b>
                </span>
              </>
            ) : (
              <span className="rail-item">
                LAUNCH <b>STANDBY</b>
              </span>
            )}
            <span className="rail-item network">{agent.networkLabel?.toUpperCase() ?? "UNAVAILABLE"}</span>
          </div>
        </div>
      </section>

      {/* 02. OPPORTUNITY INTELLIGENCE WORKSPACE */}
      <section id="opportunities" className="app-section app-workspace-section" aria-labelledby="opportunities-title">
        <div className="app-section-heading">
          <div>
            <span className="label">02 / Opportunity workspace</span>
            <h2 id="opportunities-title">OPPORTUNITY WORKSPACE</h2>
          </div>
          <Link className="section-link label" href={`/stock/${topOpportunity.symbol}`}>
            Open stock workspace ↗
          </Link>
        </div>

        {/* JEV Intelligence Workspace */}
        <OverviewWorkspace
          overviewTab={overviewTab}
          onOverviewTab={setOverviewTab}
          rows={rows}
          query={query}
          onQuery={setQuery}
          decision={decision}
          onDecision={setDecision}
          sort={sort}
          onSort={selectSort}
          selectedSymbol={selectedSymbol}
          onSelect={handleSelectSymbol}
          hoveredSymbol={hoveredSymbol}
          onHover={setHoveredSymbol}
          inspectedAsset={inspectedAsset}
          inspectedPairing={inspectedPairing}
          agent={agent}
          memory={memory}
          launch={launch}
          passedChecks={passedChecks}
          oppsMap={oppsMap}
        />
      </section>

      {/* 03. JEV OPPORTUNITY FIELD */}
      <section id="market-map" className="app-section app-workspace-section" aria-labelledby="market-map-title">
        <div className="app-section-heading">
          <div>
            <span className="label">03 / Opportunity space</span>
            <h2 id="market-map-title">JEV OPPORTUNITY FIELD</h2>
          </div>
          <span className="label">X / PAIRABILITY · Y / NARRATIVE</span>
        </div>
        <OpportunityField
          variant="expanded"
          assets={ordered}
          selectedAsset={selectedAsset}
          selectedPairing={inspectedPairing}
          pairings={pairings}
          onSelect={handleSelectSymbol}
          hoveredSymbol={hoveredSymbol}
          onHover={setHoveredSymbol}
          onReset={handleResetSymbol}
          launch={launch}
          passedChecks={passedChecks}
          oppsMap={oppsMap}
        />
      </section>

      {/* 04. DECISION TRACE */}
      <section id="decision-trace" className="app-section app-workspace-section" aria-labelledby="decision-trace-title">
        <div className="app-section-heading">
          <div>
            <span className="label">04 / Observable agent activity</span>
            <h2 id="decision-trace-title">DECISION TRACE</h2>
          </div>
          <span className="label">Observable decision events · Phase 0</span>
        </div>
        <DecisionTrace agent={agent} memory={memory} />
      </section>

      {/* 05. CURRENT PAIRING */}
      <section id="pairings" className="app-section app-workspace-section" aria-labelledby="pairings-title">
        <div className="app-section-heading">
          <div>
            <span className="label">05 / Pairing intelligence</span>
            <h2 id="pairings-title">CURRENT PAIRING</h2>
          </div>
          <Link className="section-link label" href="/pairing">
            Open pairing workspace ↗
          </Link>
        </div>
        {pairings.length === 0 ? (
          <div className="app-pairing-focus empty-state">
            <span className="label">Pairing candidate / Intelligence</span>
            <h3>No pairing proposals published</h3>
            <p>The agent has not published a qualified pairing candidate for currently monitored market opportunities.</p>
            <Link className="side-cta" href="/pairing">
              Inspect pairing workspace →
            </Link>
          </div>
        ) : (
          <div className="app-action-layout">
            <PairingAction pairing={inspectedPairing} selectedSymbol={inspectedAsset.symbol} />
            <aside className="app-alternatives" aria-label="Pairing alternatives">
              <span className="label">Alternatives / worker state</span>
              {pairings
                .filter((pairing) => pairing.slug !== inspectedPairing?.slug)
                .slice(0, 3)
                .map((pairing) => (
                  <Link href={`/pairing/${pairing.slug}`} key={pairing.slug}>
                    <b>
                      {pairing.stockSymbol} × {pairing.symbol}
                    </b>
                    <span>
                      {pairing.pairScore.toFixed(1)} · {pairing.status.replaceAll("_", " ")}
                    </span>
                    <i>↗</i>
                  </Link>
                ))}
            </aside>
          </div>
        )}
      </section>

      {/* 06. LAUNCH READINESS */}
      <section id="launch" className="app-section app-workspace-section" aria-labelledby="launch-title">
        <div className="app-section-heading">
          <div>
            <span className="label">06 / Controlled progression</span>
            <h2 id="launch-title">LAUNCH READINESS</h2>
          </div>
          <Link className="section-link label" href="/launch">
            Open launch workspace ↗
          </Link>
        </div>
        <LaunchSummary launch={launch} pairing={featuredPairing} passedChecks={passedChecks} />
      </section>

      {/* 07. AGENT MEMORY */}
      <section id="memory" className="app-section app-workspace-section" aria-labelledby="memory-title">
        <div className="app-section-heading">
          <div>
            <span className="label">07 / Stateful record</span>
            <h2 id="memory-title">AGENT MEMORY</h2>
          </div>
          <Link className="section-link label" href="/memory">
            Open memory workspace ↗
          </Link>
        </div>
        <MemorySummary agent={agent} memory={memory} />
      </section>
    </>
  );
}

/* ==========================================================================
   WORKSPACE TABS & RIGHT INSPECTOR
   ========================================================================== */

function OverviewWorkspace({
  overviewTab,
  onOverviewTab,
  rows,
  query,
  onQuery,
  decision,
  onDecision,
  sort,
  onSort,
  selectedSymbol,
  onSelect,
  hoveredSymbol,
  onHover,
  inspectedAsset,
  inspectedPairing,
  agent,
  memory,
  launch,
  passedChecks,
  oppsMap,
}: {
  overviewTab: OverviewTab;
  onOverviewTab: (value: OverviewTab) => void;
  rows: Stock[];
  query: string;
  onQuery: (value: string) => void;
  decision: DecisionFilter;
  onDecision: (value: DecisionFilter) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  hoveredSymbol: string | null;
  onHover: (symbol: string | null) => void;
  inspectedAsset: Stock;
  inspectedPairing?: Pairing | null;
  agent: AgentRuntime;
  memory: MemoryRecord[];
  launch?: Launch | null;
  passedChecks: number;
  oppsMap: Map<string, OpportunityApi>;
}) {
  return (
    <div className="overview-workspace" aria-label="Current operating workspace">
      <div className="overview-main-panel">
        {/* Compact trading-terminal tab bar */}
        <div className="overview-view-tabs" role="tablist" aria-label="Current workspace views">
          <button
            type="button"
            role="tab"
            id="tab-rank"
            aria-controls="overview-opportunity-rank"
            aria-selected={overviewTab === "rank"}
            onClick={() => onOverviewTab("rank")}
          >
            OPPORTUNITY RANK
          </button>
          <button
            type="button"
            role="tab"
            id="tab-trace"
            aria-controls="overview-decision-trace"
            aria-selected={overviewTab === "trace"}
            onClick={() => onOverviewTab("trace")}
          >
            DECISION TRACE
          </button>
        </div>

        {/* Tab Body */}
        <div
          className="overview-view-body"
          id={overviewTab === "rank" ? "overview-opportunity-rank" : "overview-decision-trace"}
        >
          {overviewTab === "rank" ? (
            <RankPanel
              rows={rows}
              query={query}
              onQuery={onQuery}
              decision={decision}
              onDecision={onDecision}
              sort={sort}
              onSort={onSort}
              selectedSymbol={selectedSymbol}
              onSelect={onSelect}
              onHover={onHover}
            />
          ) : (
            <DecisionTrace agent={agent} memory={memory} />
          )}
        </div>
      </div>

      {/* Refined Right Inspector */}
      <DecisionInspector
        asset={inspectedAsset}
        pairing={inspectedPairing}
        launch={launch}
        passedChecks={passedChecks}
        isHovered={Boolean(hoveredSymbol && hoveredSymbol !== selectedSymbol)}
        oppsMap={oppsMap}
      />
    </div>
  );
}

/* ==========================================================================
   OPPORTUNITY RANK PANEL
   ========================================================================== */

function RankPanel({
  rows,
  query,
  onQuery,
  decision,
  onDecision,
  sort,
  onSort,
  selectedSymbol,
  onSelect,
  onHover,
}: {
  rows: Stock[];
  query: string;
  onQuery: (value: string) => void;
  decision: DecisionFilter;
  onDecision: (value: DecisionFilter) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  onHover?: (symbol: string | null) => void;
}) {
  const router = useRouter();

  const openAsset = (asset: Stock, event?: { target: EventTarget | null }) => {
    onSelect(asset.symbol);
    if (event && (event.target as HTMLElement | null)?.closest("a,button,input")) return;
    router.push(`/stock/${asset.symbol}`);
  };

  const onRowKeyDown = (asset: Stock, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAsset(asset);
    }
  };

  return (
    <div className="app-data-frame rank-panel">
      {/* Top controls: Search on left, compact segmented control on right */}
      <div className="tools-row">
        <label className="tsearch">
          <span aria-hidden="true" className="search-icon">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            type="search"
            placeholder="Search assets..."
            aria-label="Filter opportunities"
          />
        </label>
        <div className="seg" role="group" aria-label="Decision filter">
          <button type="button" aria-pressed={decision === "all"} onClick={() => onDecision("all")}>
            ALL
          </button>
          <button type="button" aria-pressed={decision === "PROMOTE"} onClick={() => onDecision("PROMOTE")}>
            PROMOTED
          </button>
          <button type="button" aria-pressed={decision === "DEMOTE"} onClick={() => onDecision("DEMOTE")}>
            DOWNRANKED
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="rtable">
          <caption className="sr-only">JEVO opportunity ranking</caption>
          <colgroup>
            <col className="col-rank" />
            <col className="col-asset" />
            <col className="col-score" />
            <col className="col-delta" />
            <col className="col-decision" />
            <col className="col-evaluated" />
            <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => onSort("rank")}>
                  Rank <span className="arrow">{sort === "rank" ? "↑" : "↕"}</span>
                </button>
              </th>
              <th>Asset</th>
              <th>
                <button type="button" onClick={() => onSort("score")}>
                  Opportunity score <span className="arrow">{sort === "score" ? "↑" : "↕"}</span>
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("delta")}>
                  Delta <span className="arrow">{sort === "delta" ? "↑" : "↕"}</span>
                </button>
              </th>
              <th>JEV decision</th>
              <th>Evaluated</th>
              <th>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => {
              const isSelected = asset.symbol === selectedSymbol;
              return (
                <tr
                  key={asset.symbol}
                  tabIndex={0}
                  aria-selected={isSelected}
                  className={`${asset.currentRank === 1 ? "top " : ""}${isSelected ? "is-selected" : ""}`}
                  onFocus={() => {
                    onSelect(asset.symbol);
                    onHover?.(asset.symbol);
                  }}
                  onPointerEnter={() => onHover?.(asset.symbol)}
                  onPointerLeave={() => onHover?.(null)}
                  onClick={(event) => openAsset(asset, event)}
                  onKeyDown={(event) => onRowKeyDown(asset, event)}
                >
                  <td className="pos">{String(asset.currentRank).padStart(2, "0")}</td>
                  <td className="asset">
                    <Link href={`/stock/${asset.symbol}`} onClick={() => onSelect(asset.symbol)}>
                      <b>{asset.symbol}</b>
                      <span>{asset.name.replace(" Stock Token", "")}</span>
                    </Link>
                  </td>
                  <td>
                    <span className="mbar">
                      <span>{asset.opportunityScore.toFixed(1)}</span>
                      <i style={{ "--w": `${asset.opportunityScore}%` } as CSSProperties} />
                    </span>
                  </td>
                  <td className={`delta ${asset.rankMovement !== null && asset.rankMovement > 0 ? "up" : asset.rankMovement !== null && asset.rankMovement < 0 ? "dn" : "flat"}`}>
                    {asset.rankMovement !== null && asset.rankMovement > 0 ? `▲+${asset.rankMovement}` : asset.rankMovement !== null && asset.rankMovement < 0 ? `▼${Math.abs(asset.rankMovement)}` : "—"}
                  </td>
                  <td className={`dec-tag ${asset.jevDecision === "PROMOTE" ? "promote" : asset.rankMovement !== null && asset.rankMovement < 0 ? "demote" : ""}`}>
                    {asset.jevDecision.replaceAll("_", " ")}
                  </td>
                  <td className="evaluated">{formatClock(asset.lastEvaluatedAt)} UTC</td>
                  <td className="row-go" aria-hidden="true">
                    ↗
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="panel-foot">
        <span className="label">
          Pairability measure, not an investment-return prediction. Select a row to inspect or open its stock workspace.
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   SIGNAL NORMALIZATION & OPPORTUNITY FIELD
   ========================================================================== */

type AssetCoordinates = { opportunity: number; narrative: number };

function getAssetCoordinates(
  asset: Stock,
  oppsMap?: Map<string, OpportunityApi>,
): AssetCoordinates | null {
  const opp = oppsMap?.get(asset.symbol);
  const narrative = opp?.score?.narrativeMomentum;
  const opportunity = asset.opportunityScore;
  if (typeof opportunity !== "number" || typeof narrative !== "number") return null;
  return {
    opportunity,
    narrative,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface LabelPlacement {
  symbol: string;
  labelX: number;
  labelY: number;
  anchor: "start" | "end" | "middle";
  hasLeader: boolean;
  leaderX: number;
  leaderY: number;
}

function computeLabelPlacements(
  positions: Array<{ x: number; y: number; asset: Stock }>,
  plot: { left: number; right: number; top: number; bottom: number }
): Map<string, LabelPlacement> {
  const result = new Map<string, LabelPlacement>();

  // Candidate slots relative to node (x, y): [dx, dy, anchor]
  const candidateSlots: Array<[number, number, "start" | "end" | "middle"]> = [
    [16, -3, "start"],     // 0: Right-middle (standard)
    [-16, -3, "end"],      // 1: Left-middle
    [16, 20, "start"],     // 2: Bottom-Right
    [-16, 20, "end"],      // 3: Bottom-Left
    [16, -24, "start"],    // 4: Top-Right
    [-16, -24, "end"],     // 5: Top-Left
    [0, -28, "middle"],    // 6: Top-Center
    [0, 26, "middle"],     // 7: Bottom-Center
    [26, 4, "start"],      // 8: Far-Right
    [-26, 4, "end"],       // 9: Far-Left
  ];

  const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  // Sort by x desc, then y asc to prioritize higher opportunity assets
  const sorted = [...positions].sort((a, b) => b.x - a.x || a.y - b.y);

  for (const pos of sorted) {
    let bestSlot = candidateSlots[0];
    let minPenalty = Infinity;

    for (const slot of candidateSlots) {
      const [dx, dy, anchor] = slot;
      const lx = pos.x + dx;
      const ly = pos.y + dy;

      const w = 68;
      const h = 26;
      const x1 = anchor === "start" ? lx : anchor === "end" ? lx - w : lx - w / 2;
      const x2 = x1 + w;
      const y1 = ly - 12;
      const y2 = y1 + h;

      let penalty = 0;

      // Plot boundary penalty
      if (x1 < plot.left + 4) penalty += (plot.left + 4 - x1) * 10;
      if (x2 > plot.right - 4) penalty += (x2 - (plot.right - 4)) * 10;
      if (y1 < plot.top + 8) penalty += (plot.top + 8 - y1) * 10;
      if (y2 > plot.bottom - 8) penalty += (y2 - (plot.bottom - 8)) * 10;

      // Overlap penalty with already placed labels
      for (const box of placedBoxes) {
        const overlapW = Math.max(0, Math.min(x2, box.x2) - Math.max(x1, box.x1));
        const overlapH = Math.max(0, Math.min(y2, box.y2) - Math.max(y1, box.y1));
        if (overlapW > 0 && overlapH > 0) {
          penalty += overlapW * overlapH * 25;
        }
      }

      // Proximity penalty (favor standard close slots)
      penalty += Math.sqrt(dx * dx + dy * dy);

      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestSlot = slot;
        if (penalty === 0) break;
      }
    }

    const [dx, dy, anchor] = bestSlot;
    const labelX = pos.x + dx;
    const labelY = pos.y + dy;
    const w = 68;
    const h = 26;
    const x1 = anchor === "start" ? labelX : anchor === "end" ? labelX - w : labelX - w / 2;
    const y1 = labelY - 12;
    placedBoxes.push({ x1, y1, x2: x1 + w, y2: y1 + h });

    const dist = Math.sqrt(dx * dx + dy * dy);
    const hasLeader = dist > 20;
    const leaderX = anchor === "start" ? labelX - 2 : anchor === "end" ? labelX + 2 : labelX;
    const leaderY = labelY + 2;

    result.set(pos.asset.symbol, {
      symbol: pos.asset.symbol,
      labelX,
      labelY,
      anchor,
      hasLeader,
      leaderX,
      leaderY,
    });
  }

  return result;
}

function OpportunityField({
  variant,
  assets,
  selectedAsset,
  selectedPairing,
  pairings,
  onSelect,
  hoveredSymbol,
  onHover,
  onReset,
  launch,
  passedChecks,
  oppsMap,
}: {
  variant: "compact" | "expanded";
  assets: Stock[];
  selectedAsset: Stock;
  selectedPairing?: Pairing | null;
  pairings?: Pairing[];
  onSelect: (symbol: string) => void;
  hoveredSymbol: string | null;
  onHover: (symbol: string | null) => void;
  onReset: () => void;
  launch?: Launch | null;
  passedChecks: number;
  oppsMap?: Map<string, OpportunityApi>;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  // Normalization boundaries:
  // Coordinate frame is 920 x 480
  const plot = { left: 92, right: 848, top: 48, bottom: 418 };

  const signalPoints = assets.flatMap((asset) => {
    const coords = getAssetCoordinates(asset, oppsMap);
    if (!coords) return [];
    return {
      asset,
      opportunity: coords.opportunity,
      narrative: coords.narrative,
    };
  });

  const unavailableSymbols = assets.filter((asset) => !getAssetCoordinates(asset, oppsMap)).map((asset) => asset.symbol);

  // Dynamic domain relative to real score distribution (e.g. ~75 to 100)
  const allOpportunity = signalPoints.map((p) => p.opportunity);
  const allNarrative = signalPoints.map((p) => p.narrative);

  const minX = allOpportunity.length > 0 ? Math.max(0, Math.floor((Math.min(...allOpportunity) - 2) / 5) * 5) : 0;
  const maxX = 100;
  const minY = allNarrative.length > 0 ? Math.max(0, Math.floor((Math.min(...allNarrative) - 2) / 5) * 5) : 0;
  const maxY = 100;

  const scaleX = (val: number) =>
    plot.left + ((clamp(val, minX, maxX) - minX) / (maxX - minX)) * (plot.right - plot.left);
  const scaleY = (val: number) =>
    plot.bottom - ((clamp(val, minY, maxY) - minY) / (maxY - minY)) * (plot.bottom - plot.top);

  const xTicks: number[] = [];
  for (let t = minX; t <= maxX; t += 5) xTicks.push(t);

  const yTicks: number[] = [];
  for (let t = minY; t <= maxY; t += 5) yTicks.push(t);

  const positions = signalPoints.map(({ asset, narrative, opportunity }) => {
    const x = scaleX(opportunity);
    const y = scaleY(narrative);

    // Historic trajectory projection derived deterministically
    const anchors = asset.scoreHistory
      .map((point) => ({ x: scaleX(point.score), y: scaleY(narrative) }));
    const currentAnchor = { x, y };
    if (anchors.length === 0 || anchors[anchors.length - 1].x !== x || anchors[anchors.length - 1].y !== y) anchors.push(currentAnchor);
    const previousAnchor = anchors.length > 1 ? anchors[0] : null;

    return {
      asset,
      narrative,
      opportunity,
      x,
      y,
      previousX: previousAnchor?.x ?? null,
      previousY: previousAnchor?.y ?? null,
      trail: anchors.map((anchor) => `${anchor.x.toFixed(1)},${anchor.y.toFixed(1)}`).join(" "),
      previousScore: asset.previousScore,
    };
  });

  const activeSymbol = hoveredSymbol ?? selectedAsset.symbol;
  const inspectedAsset = assets.find((asset) => asset.symbol === activeSymbol) ?? selectedAsset;
  const inspectedPairing = pairings?.find((pairing) => pairing.stockSymbol === inspectedAsset.symbol) ?? selectedPairing;
  const activePosition = positions.find((p) => p.asset.symbol === activeSymbol);

  const labelPlacements = useMemo(() => {
    return computeLabelPlacements(positions, plot);
  }, [positions, plot.left, plot.right, plot.top, plot.bottom]);

  const selectFieldAsset = (symbol: string) => {
    onHover(null);
    onSelect(symbol);
  };

  const handleKeyDown = (asset: Stock, event: KeyboardEvent<Element>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectFieldAsset(asset.symbol);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onReset();
    }
  };

  useEffect(() => {
    const element = fieldRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const history =
    inspectedAsset.scoreHistory.length > 0
      ? inspectedAsset.scoreHistory.slice(-24)
      : [{ score: inspectedAsset.opportunityScore }];
  const startScore = history[0]?.score ?? inspectedAsset.previousScore;
  const endScore = inspectedAsset.opportunityScore;
  const hasHistoricalStart = inspectedAsset.scoreHistory.length > 1 || inspectedAsset.previousScore !== null;
  const scoreDelta = !hasHistoricalStart || startScore === null ? null : endScore - startScore;

  return (
    <div
      className={`app-data-frame map-panel map-panel--${variant}${entered ? " is-entered" : ""}`}
      ref={fieldRef}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onReset();
        }
      }}
    >
      <div className="map-field-layout">
        <div className="map-field-canvas">
          <div className="field-canvas-meta">
            <span className="label">JEV OPPORTUNITY FIELD · CYCLE {assets[0]?.lastEvaluatedAt ? "ACTIVE" : ""}</span>
            <span className="label">HOVER TO PREVIEW · CLICK TO LOCK · ESC RESETS</span>
            {unavailableSymbols.length > 0 ? (
              <span className="label" role="status">UNAVAILABLE AXIS DATA · {unavailableSymbols.join(", ")}</span>
            ) : null}
          </div>

          <svg
            viewBox="0 0 920 480"
            preserveAspectRatio="none"
            role="group"
            aria-label="JEV Opportunity Field mapping pairability and narrative strength"
          >
            {/* SVG Definitions */}
            <defs>
              <marker
                id="field-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
              </marker>

            </defs>

            {/* Quadrant Background Zones */}
            <g className="field-quadrants" aria-hidden="true">
              {/* Q1: High Pairability & High Narrative (Top Right) */}
              <rect
                x={scaleX(85)}
                y={plot.top}
                width={plot.right - scaleX(85)}
                height={scaleY(85) - plot.top}
                fill="rgb(2 198 165 / 2.5%)"
                stroke="rgb(2 198 165 / 16%)"
                strokeWidth="1"
              />

              {/* Q2: High Narrative / Volatility (Top Left) */}
              <rect
                x={plot.left}
                y={plot.top}
                width={scaleX(85) - plot.left}
                height={scaleY(85) - plot.top}
                fill="rgb(245 158 11 / 2%)"
                stroke="rgb(245 158 11 / 12%)"
                strokeWidth="1"
              />

              {/* Q3: Low Conviction / Monitor (Bottom Left) */}
              <rect
                x={plot.left}
                y={scaleY(85)}
                width={scaleX(85) - plot.left}
                height={plot.bottom - scaleY(85)}
                fill="rgb(255 255 255 / 0.8%)"
                stroke="rgb(255 255 255 / 5%)"
                strokeWidth="1"
              />

              {/* Q4: Emerging Pairability (Bottom Right) */}
              <rect
                x={scaleX(85)}
                y={scaleY(85)}
                width={plot.right - scaleX(85)}
                height={plot.bottom - scaleY(85)}
                fill="rgb(59 130 246 / 1.5%)"
                stroke="rgb(59 130 246 / 9%)"
                strokeWidth="1"
              />
            </g>

            {/* Quadrant Classification Labels */}
            <g className="field-context" aria-hidden="true">
              <text x={plot.left + 14} y={plot.top + 40} className="field-quadrant-badge">
                HIGH NARRATIVE
              </text>
              <text x={plot.right - 14} y={plot.top + 40} textAnchor="end" className="field-quadrant-badge">
                HIGH PAIRABILITY
              </text>
              <text x={plot.left + 14} y={plot.bottom - 12} className="field-quadrant-badge">
                LOW CONVICTION
              </text>
              <text x={plot.right - 14} y={plot.bottom - 12} textAnchor="end" className="field-quadrant-badge">
                EMERGING
              </text>
            </g>

            {/* Grid Lines */}
            <g className="field-grid" aria-hidden="true">
              {yTicks.map((val) => {
                const y = scaleY(val);
                const isMid = val === 85;
                return (
                  <line
                    key={`h-${val}`}
                    x1={plot.left}
                    y1={y}
                    x2={plot.right}
                    y2={y}
                    className={isMid ? "field-grid-major" : "field-grid-minor"}
                  />
                );
              })}
              {xTicks.map((val) => {
                const x = scaleX(val);
                const isMid = val === 85;
                return (
                  <line
                    key={`v-${val}`}
                    x1={x}
                    y1={plot.top}
                    x2={x}
                    y2={plot.bottom}
                    className={isMid ? "field-grid-major" : "field-grid-minor"}
                  />
                );
              })}
            </g>

            {/* Axes & Ticks with Numeric Scale Values */}
            <g className="field-axes" aria-hidden="true">
              {/* Baseline axes */}
              <line className="field-axis" x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} />
              <line className="field-axis" x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} />

              {/* X-Axis Ticks & Values */}
              {xTicks.map((val) => {
                const x = scaleX(val);
                return (
                  <g key={`xtick-${val}`}>
                    <line x1={x} y1={plot.bottom} x2={x} y2={plot.bottom + 6} className="field-tick" />
                    <text x={x} y={plot.bottom + 18} textAnchor="middle" className="field-scale-text">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Y-Axis Ticks & Values */}
              {yTicks.map((val) => {
                const y = scaleY(val);
                return (
                  <g key={`ytick-${val}`}>
                    <line x1={plot.left - 6} y1={y} x2={plot.left} y2={y} className="field-tick" />
                    <text x={plot.left - 10} y={y + 4} textAnchor="end" className="field-scale-text">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal axis headings keep the coordinate system legible. */}
              <text x={plot.left + 14} y={plot.top + 17} className="field-axis-title">
                NARRATIVE MOMENTUM ↑
              </text>
              <text x={plot.left + 14} y={plot.bottom + 38} textAnchor="start" className="field-axis-title">
                OPPORTUNITY SCORE →
              </text>
            </g>

            {/* Continuous Motion: Ambient Radar Telemetry Scan Line */}
            <line
              className="field-scan-line"
              x1={plot.left}
              y1={plot.top}
              x2={plot.left}
              y2={plot.bottom}
              aria-hidden="true"
            />

            {/* JEV Qualification Threshold Boundary Curve (≥ 90) */}
            <g className="field-boundary" aria-hidden="true">
              <path
                d={`M ${scaleX(80)} ${scaleY(100)} Q ${scaleX(90)} ${scaleY(90)} ${scaleX(100)} ${scaleY(80)}`}
                className="gate-boundary-curve"
              />
              <text x={scaleX(90) - 10} y={scaleY(90) - 10} className="gate-boundary-label">
                JEV QUALIFICATION FRONTIER (SCORE ≥ 90.0) ↗
              </text>
            </g>

            {/* Dynamic Crosshair Projections for Active Asset */}
            {activePosition && (
              <g className="field-active-projection" aria-hidden="true">
                {/* Horizontal line to Y axis */}
                <line
                  x1={plot.left}
                  y1={activePosition.y}
                  x2={activePosition.x}
                  y2={activePosition.y}
                  className="field-projection-line"
                />
                {/* Y-axis projected pill */}
                <rect
                  x={plot.left - 42}
                  y={activePosition.y - 8}
                  width="32"
                  height="16"
                  rx="2"
                  className="field-axis-badge-bg"
                />
                <text
                  x={plot.left - 26}
                  y={activePosition.y + 3.5}
                  textAnchor="middle"
                  className="field-axis-badge-text"
                >
                  {activePosition.narrative.toFixed(1)}
                </text>

                {/* Vertical line to X axis */}
                <line
                  x1={activePosition.x}
                  y1={activePosition.y}
                  x2={activePosition.x}
                  y2={plot.bottom}
                  className="field-projection-line"
                />
                {/* X-axis projected pill */}
                <rect
                  x={activePosition.x - 16}
                  y={plot.bottom + 6}
                  width="32"
                  height="16"
                  rx="2"
                  className="field-axis-badge-bg"
                />
                <text
                  x={activePosition.x}
                  y={plot.bottom + 17.5}
                  textAnchor="middle"
                  className="field-axis-badge-text"
                >
                  {activePosition.opportunity.toFixed(1)}
                </text>
              </g>
            )}

            {/* Active Transition Story (Previous State → JEV Evaluation → Current State) */}
            {activePosition && (
              <g className="field-transition-story" aria-label={`State transition telemetry for ${activePosition.asset.symbol}`}>
                {/* Vector Trail from Previous to Current */}
                {activePosition.previousX !== null &&
                activePosition.previousY !== null &&
                Math.hypot(activePosition.x - activePosition.previousX, activePosition.y - activePosition.previousY) > 2 ? (
                  <line
                    x1={activePosition.previousX}
                    y1={activePosition.previousY}
                    x2={activePosition.x}
                    y2={activePosition.y}
                    className="field-selected-vector"
                    markerEnd="url(#field-arrow)"
                  />
                ) : null}

                {/* Previous State Anchor at (previousX, previousY) */}
                {activePosition.previousX !== null &&
                activePosition.previousY !== null &&
                Math.hypot(activePosition.x - activePosition.previousX, activePosition.y - activePosition.previousY) > 2 ? (
                  <g className="field-prev-anchor" transform={`translate(${activePosition.previousX}, ${activePosition.previousY})`}>
                    <circle cx="0" cy="0" r="7" className="prev-anchor-ring" />
                    <circle cx="0" cy="0" r="2.5" className="prev-anchor-core" />
                    <text
                      x="0"
                      y={activePosition.previousY > activePosition.y ? 18 : -12}
                      textAnchor="middle"
                      className="field-prev-tag"
                    >
                      PREV {activePosition.asset.previousRank === null || activePosition.asset.previousScore === null ? "UNAVAILABLE" : `#${String(activePosition.asset.previousRank).padStart(2, "0")} (${activePosition.asset.previousScore.toFixed(1)})`}
                    </text>
                  </g>
                ) : null}

                {/* Restrained JEV Decision Marker along the transition trajectory */}
                <g
                  // Keep the JEV gate in the quiet upper-left of the field so it
                  // identifies the system without colliding with asset labels.
                  transform={`translate(${plot.left + 18}, ${plot.top + 62})`}
                  className="field-jev-decision-marker"
                  aria-hidden="true"
                >
                  <rect x="0" y="0" width="88" height="28" rx="3" className="decision-marker-bg" />
                  <image
                    href="/logo.png"
                    x="6"
                    y="6"
                    width="16"
                    height="16"
                    preserveAspectRatio="xMidYMid meet"
                    className="decision-marker-logo"
                  />
                  <text x="28" y="12" className="decision-marker-label">
                    JEV EVAL
                  </text>
                  <text x="28" y="22" className="decision-marker-decision">
                    {activePosition.asset.jevDecision.replaceAll("_", " ")}
                  </text>
                </g>

              </g>
            )}

            {/* Asset Nodes */}
            {positions.map((position) => {
              const isSelected = selectedAsset.symbol === position.asset.symbol;
              const isActive = activeSymbol === position.asset.symbol;
              const placement = labelPlacements.get(position.asset.symbol);
              const labelAnchor = placement?.anchor ?? (position.x > plot.right - 130 ? "end" : "start");
              const labelX = placement?.labelX ?? (position.x + (labelAnchor === "end" ? -16 : 16));
              const labelY = placement?.labelY ?? (position.y - 3);

              return (
                <g
                  key={position.asset.symbol}
                  className={`field-asset${isActive ? " is-active" : ""}${isSelected ? " is-selected" : ""}${
                    !isActive && hoveredSymbol ? " is-muted" : ""
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${position.asset.symbol}, rank ${position.asset.currentRank}, score ${position.asset.opportunityScore.toFixed(1)}. Activate to select.`}
                  aria-pressed={isSelected}
                  onClick={() => selectFieldAsset(position.asset.symbol)}
                  onPointerEnter={() => onHover(position.asset.symbol)}
                  onPointerLeave={() => onHover(null)}
                  onFocus={() => onHover(position.asset.symbol)}
                  onBlur={() => onHover(null)}
                  onKeyDown={(event) => handleKeyDown(position.asset, event)}
                >
                  {/* Transparent hit area for reliable clicks */}
                  <rect
                    x={position.x - 28}
                    y={position.y - 28}
                    width="56"
                    height="56"
                    fill="transparent"
                  />

                  {/* Subtle historic trail for non-active assets */}
                  {!isActive && (
                    <polyline className="field-trail" points={position.trail} />
                  )}

                  {/* Collision-avoidance leader line connecting node to offset label */}
                  {placement?.hasLeader && (
                    <line
                      x1={position.x}
                      y1={position.y}
                      x2={placement.leaderX}
                      y2={placement.leaderY}
                      className="field-label-leader"
                    />
                  )}

                  {/* Precision Crosshair Ticks */}
                  <g className="field-crosshairs" aria-hidden="true">
                    <line x1={position.x - 7} y1={position.y} x2={position.x + 7} y2={position.y} />
                    <line x1={position.x} y1={position.y - 7} x2={position.x} y2={position.y + 7} />
                  </g>

                  {/* Concentric Telemetry Rings for Active / Selected */}
                  {isActive && (
                    <>
                      <circle className="field-ring" cx={position.x} cy={position.y} r="16" />
                      <circle className="field-ring-outer" cx={position.x} cy={position.y} r="24" />
                    </>
                  )}

                  {/* Node (Precision Square Geometry) */}
                  <rect
                    className="field-node"
                    x={position.x - (isActive ? 6 : 4.5)}
                    y={position.y - (isActive ? 6 : 4.5)}
                    width={isActive ? 12 : 9}
                    height={isActive ? 12 : 9}
                    rx="1.5"
                  />

                  {/* Asset Symbol */}
                  <text
                    className="field-label"
                    textAnchor={labelAnchor}
                    x={labelX}
                    y={labelY}
                  >
                    {position.asset.symbol}
                  </text>

                  {/* Value / Rank / Score */}
                  <text
                    className="field-value"
                    textAnchor={labelAnchor}
                    x={labelX}
                    y={labelY + 13}
                  >
                    #{String(position.asset.currentRank).padStart(2, "0")} / {position.asset.opportunityScore.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Dedicated 24-Cycle Telemetry Trajectory Chart */}
          <div className="field-sparkline-panel" aria-label="Score progression trajectory">
            <div className="sparkline-header">
              <div className="sparkline-title">
                <span className="spark-beacon" />
                <span className="spark-title-text">
                  SCORE TRAJECTORY · 24-CYCLE AGENT EVALUATION (<b>{inspectedAsset.symbol}</b>)
                </span>
              </div>
              <div className="sparkline-metrics">
                <span className="spark-tag">
                  START <b>{startScore === null ? "—" : startScore.toFixed(1)}</b>
                </span>
                <span className="spark-arrow">→</span>
                <span className="spark-tag current">
                  CURRENT <b>{endScore.toFixed(1)}</b>
                </span>
                <span className={`spark-delta ${scoreDelta === null || Math.abs(scoreDelta) < 0.05 ? "flat" : scoreDelta > 0 ? "up" : "dn"}`}>
                  {scoreDelta === null
                    ? "—"
                    : Math.abs(scoreDelta) < 0.05
                      ? "0.0 PTS (STEADY)"
                      : scoreDelta > 0
                        ? `▲ +${scoreDelta.toFixed(1)} PTS`
                        : `▼ ${Math.abs(scoreDelta).toFixed(1)} PTS`}
                </span>
                <span className="spark-conf">
                  CONFIDENCE <b>{inspectedAsset.confidence === null ? "—" : `${inspectedAsset.confidence}%`}</b>
                </span>
              </div>
            </div>

            <div className="sparkline-svg-wrap">
              <svg viewBox="0 0 840 68" preserveAspectRatio="none" className="sparkline-svg">
                <defs>
                  <linearGradient id="sparkline-fill-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Sparkline horizontal guide lines */}
                <line x1="0" y1="14" x2="840" y2="14" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
                <line x1="0" y1="36" x2="840" y2="36" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                <line x1="0" y1="58" x2="840" y2="58" stroke="rgba(255, 255, 255, 0.12)" />

                {(() => {
                  const scores = history.map((h) => h.score);
                  const rawMin = Math.min(...scores);
                  const rawMax = Math.max(...scores);
                  const variance = rawMax - rawMin;
                  const isFlat = variance < 0.2;

                  // Center flat scores cleanly on the middle guide line (y = 36)
                  // When dynamic, enforce at least a 10pt span so sub-point noise is never amplified into a zigzag
                  const midVal = (rawMin + rawMax) / 2;
                  const span = Math.max(variance, 10);
                  const minVal = isFlat ? midVal - 5 : midVal - span * 0.55;
                  const maxVal = isFlat ? midVal + 5 : midVal + span * 0.55;

                  const pts = history.map((h, i) => {
                    const x = history.length === 1 ? 420 : 20 + (i / (history.length - 1)) * 800;
                    const norm = (clamp(h.score, minVal, maxVal) - minVal) / Math.max(maxVal - minVal, 1e-4);
                    const y = 58 - norm * 44;
                    return { x, y, score: h.score };
                  });

                  const pathD = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
                  const areaD = `${pathD} L ${pts[pts.length - 1]?.x ?? 820} 58 L ${pts[0]?.x ?? 20} 58 Z`;

                  return (
                    <g>
                      <path d={areaD} fill="url(#sparkline-fill-grad)" />
                      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
                      {pts.map((p, idx) => {
                        const isStart = idx === 0;
                        const isEnd = idx === pts.length - 1;
                        const isSignificant =
                          pts.length <= 12 ||
                          isStart ||
                          isEnd ||
                          (!isFlat && idx > 0 && Math.abs(p.score - pts[idx - 1].score) >= 0.5);

                        return (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isStart || isEnd ? 3.5 : 2.5}
                              fill="#08090a"
                              stroke="var(--accent)"
                              strokeWidth="1.5"
                            />
                            {isSignificant ? (
                              <text x={p.x} y={p.y - 7} textAnchor="middle" className="spark-pt-val">
                                {p.score.toFixed(1)}
                              </text>
                            ) : null}
                          </g>
                        );
                      })}
                      {isFlat && pts.length > 6 && (
                        <text
                          x="420"
                          y="22"
                          textAnchor="middle"
                          fill="var(--accent)"
                          opacity="0.6"
                          fontSize="9"
                          fontFamily="var(--mono)"
                          letterSpacing="0.08em"
                        >
                          STEADY EVALUATION · 0.0 PTS DRIFT ({pts.length} CYCLES)
                        </text>
                      )}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* In expanded mode (Section 03), show dedicated side inspector */}
        {variant === "expanded" ? (
          <DecisionInspector
            asset={inspectedAsset}
            pairing={inspectedPairing}
            launch={launch}
            passedChecks={passedChecks}
            isHovered={Boolean(hoveredSymbol && hoveredSymbol !== selectedAsset.symbol)}
            oppsMap={oppsMap}
          />
        ) : null}
      </div>

      <div className="map-foot label">
        Anchors derive deterministically from worker rank and score history. Axis values are normalized persisted dimensions; no market-price series is implied.
      </div>
    </div>
  );
}

/* ==========================================================================
   DECISION INSPECTOR (TERMINAL RIGHT RAIL)
   ========================================================================== */

function DecisionInspector({
  asset,
  pairing,
  launch,
  passedChecks,
  isHovered,
  oppsMap,
}: {
  asset: Stock;
  pairing?: Pairing | null;
  launch?: Launch | null;
  passedChecks: number;
  isHovered?: boolean;
  oppsMap?: Map<string, OpportunityApi>;
}) {
  const coords = getAssetCoordinates(asset, oppsMap);
  const narrative = coords?.narrative ?? null;
  const opportunity = coords?.opportunity ?? asset.opportunityScore;
  const formatCoordinate = (value: number | null) => (value === null ? "—" : value.toFixed(1));
  const launchApplies = launch && pairing ? pairing.slug === launch.selectedPairingSlug : false;

  return (
    <aside className="decision-inspector" aria-live="polite">
      {/* 1. Header with Status */}
      <div className="decision-inspector-head">
        <span className="label">{isHovered ? "SIGNAL PREVIEW" : "SELECTED INTELLIGENCE"}</span>
        <span className={`label ${isHovered ? "tag-hover" : "tag-locked"}`}>
          {isHovered ? "HOVER" : "LOCKED"}
        </span>
      </div>

      {/* 2. Asset & Rank */}
      <div className="decision-asset">
        <div className="decision-asset-top">
          <strong>{asset.symbol}</strong>
          <span className="decision-rank">#{String(asset.currentRank).padStart(2, "0")}</span>
        </div>
        <span className="decision-asset-name">{asset.name.replace(" Stock Token", "")}</span>
      </div>

      {/* 3. Opportunity Score */}
      <div className="decision-score-block">
        <strong className="decision-score-val">{asset.opportunityScore.toFixed(1)}</strong>
        <span className="label">OPPORTUNITY SCORE</span>
      </div>

      {/* 4. JEV Decision */}
      <div className="decision-action-block">
        <div className="decision-tag-line">
          <strong className={`decision-tag ${asset.jevDecision === "PROMOTE" ? "accent" : ""}`}>
            {asset.jevDecision.replaceAll("_", " ")}
          </strong>
        </div>
        <span className="label">JEV DECISION · {asset.confidence === null ? "—" : `${asset.confidence}%`} CONFIDENCE</span>
      </div>

      {/* 5. Trajectory Transition */}
      <div
        className="decision-trajectory-block"
        aria-label={`JEV state transition from ${asset.previousRank === null || asset.previousScore === null ? "unavailable" : `rank ${asset.previousRank} score ${asset.previousScore.toFixed(1)}`} to rank ${asset.currentRank} score ${asset.opportunityScore.toFixed(1)}`}
      >
        <div className="traj-col">
          <span className="label">PREVIOUS</span>
          <b>
            {asset.previousRank === null || asset.previousScore === null ? "UNAVAILABLE" : `#${String(asset.previousRank).padStart(2, "0")} / ${asset.previousScore.toFixed(1)}`}
          </b>
        </div>
        <div className="traj-mid">
          <span className="traj-arrow">→</span>
          <span className="traj-engine-tag">JEV</span>
        </div>
        <div className="traj-col right">
          <span className="label">CURRENT</span>
          <b className={asset.previousRank !== null && asset.currentRank < asset.previousRank ? "accent" : ""}>
            #{String(asset.currentRank).padStart(2, "0")} / {asset.opportunityScore.toFixed(1)}
          </b>
        </div>
      </div>

      {/* 6. Narrative & Opportunity Signals */}
      <div className="decision-signals-grid">
        <div className="sig-item">
          <span className="label">NARRATIVE MOMENTUM</span>
          <strong className="sig-val">{formatCoordinate(narrative)}</strong>
        </div>
        <div className="sig-item">
          <span className="label">OPPORTUNITY SCORE</span>
          <strong className="sig-val">{formatCoordinate(opportunity)}</strong>
        </div>
      </div>

      {/* 7. Qualified Pairing */}
      <div className="decision-pairing-block">
        <span className="label">QUALIFIED PAIR</span>
        {pairing ? (
          <div className="pairing-content">
            <b>
              {pairing.stockSymbol} × {pairing.symbol}
            </b>
            <span className="pairing-score accent">{pairing.pairScore.toFixed(1)}</span>
          </div>
        ) : (
          <div className="pairing-empty">
            <b>NO QUALIFIED PAIR</b>
            <span className="label">No pair record in active cycle</span>
          </div>
        )}
      </div>

      {/* 8. Last Evaluated */}
      <div className="decision-evaluated-block">
        <span className="label">LAST EVALUATED</span>
        <span className="evaluated-time">{formatClock(asset.lastEvaluatedAt)} UTC</span>
      </div>

      {/* 9. Inspector Action Links */}
      <div className="decision-inspector-actions">
        <Link href={`/stock/${asset.symbol}`} className="inspector-cta-primary">
          OPEN STOCK WORKSPACE ↗
        </Link>
        {pairing ? (
          <Link href={`/pairing/${pairing.slug}`} className="inspector-cta-secondary">
            INSPECT PAIRING ↗
          </Link>
        ) : launchApplies && launch ? (
          <Link href="/launch" className="inspector-cta-secondary">
            INSPECT LAUNCH ({passedChecks}/{launch.policyChecks.length}) ↗
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

/* ==========================================================================
   DECISION TRACE, PAIRING, LAUNCH & MEMORY SUBSYSTEMS
   ========================================================================== */

function DecisionTrace({ agent, memory }: { agent: AgentRuntime; memory: MemoryRecord[] }) {
  const entries = useMemo<TraceEntry[]>(() => {
    const observed: TraceEntry[] = agent.latestEvents.map((event: AgentEvent) => ({
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      subject: event.subject,
      previousState: "—",
      currentState: "—",
      decision: event.type === "JEV_DECISION" ? "BOUNDED DECISION" : "OBSERVED",
      summary: event.summary,
    }));
    const remembered: TraceEntry[] = memory.map((record) => ({
      id: record.id,
      timestamp: record.timestamp,
      type: record.eventType,
      subject: record.subject,
      previousState: record.previousState,
      currentState: record.currentState,
      decision: record.decision,
      summary: record.summary,
    }));
    return [...observed, ...remembered].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 10);
  }, [agent.latestEvents, memory]);

  return (
    <div className="app-data-frame trace-panel">
      <div className="trace-table" role="table" aria-label="Observable decision trace">
        <div className="trace-row trace-head" role="row">
          <span>Time</span>
          <span>Event / subject</span>
          <span>State change</span>
          <span>Decision</span>
        </div>
        {entries.map((entry) => (
          <div className={`trace-row${entry.type === "JEV_DECISION" ? " is-decision" : ""}`} role="row" key={entry.id}>
            <span className="trace-time">{formatClock(entry.timestamp)}</span>
            <span>
              <b>{entry.type.replaceAll("_", " ")}</b>
              <small>{entry.subject}</small>
              <em>{entry.summary}</em>
            </span>
            <span className="trace-state">
              {entry.previousState === "—" ? "—" : `${entry.previousState} → ${entry.currentState}`}
            </span>
            <span className="trace-decision">{entry.decision}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PairingAction({ pairing, selectedSymbol }: { pairing?: Pairing; selectedSymbol: string }) {
  if (!pairing) {
    return (
      <div className="app-pairing-focus empty-state">
        <span className="label">Pairing candidate / {selectedSymbol}</span>
        <h3>NO CANONICAL PAIRING</h3>
        <p>There is no qualified pairing record for {selectedSymbol} in the current worker state.</p>
        <Link className="side-cta" href="/pairing">
          Inspect pairing workspace →
        </Link>
      </div>
    );
  }

  return (
    <div className="app-pairing-focus">
      <div className="kicker">
        <span className="label">Pairing candidate / {selectedSymbol}</span>
        <span className="label on">{pairing.status.replaceAll("_", " ")}</span>
      </div>
      <div className="pairname">
        {pairing.stockSymbol} × {pairing.symbol}
      </div>
      <div className="side-score">
        <b>{pairing.pairScore.toFixed(1)}</b>
        <span>STRONG PAIR / CONF {pairing.confidence === null ? "—" : `${pairing.confidence}%`}</span>
      </div>
      <div className="srow">
        <span>JEV decision</span>
        <span className="label on">{pairing.jevDecision.replaceAll("_", " ")}</span>
      </div>
      <p className="side-copy">{pairing.thesis.core}</p>
      <Link className="side-cta" href="/pairing">
        Open pairing workspace →
      </Link>
    </div>
  );
}

function LaunchSummary({
  launch,
  pairing,
  passedChecks,
}: {
  launch?: Launch | null;
  pairing?: Pairing | null;
  passedChecks: number;
}) {
  if (!launch) {
    return (
      <div className="app-launch-layout empty-state">
        <div className="app-launch-readout">
          <span className="label">Autonomous launch / Phase 0</span>
          <div className="clock-big">STANDBY</div>
          <h3>No active launch candidate</h3>
          <p>Launch countdown and checkpoints will activate once a pairing candidate is approved and scheduled by the operator.</p>
          <Link className="side-cta" href="/launch">
            Open launch workspace →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-launch-layout">
      <div className="app-launch-readout">
        <span className="label">
          Next agent launch / {pairing ? `${pairing.stockSymbol} × ${pairing.symbol}` : "STANDBY"}
        </span>
        <div className="clock-big">T-{formatCountdown(launch.countdownSeconds)}</div>
        <span className="label">{launch.cycleId} / Phase 0 / worker state</span>
        <ul className="lcycle">
          {launch.stages.map((stage) => (
            <li
              className={stage.status === "COMPLETE" ? "done" : stage.status === "ACTIVE" ? "now" : undefined}
              key={stage.id}
            >
              <span className="t">{stage.scheduledPoint}</span>
              <span>{stage.description}</span>
              <span className="s">{stage.status}</span>
            </li>
          ))}
        </ul>
        <Link className="side-cta" href="/launch">
          Open launch workspace →
        </Link>
      </div>
      <div className="app-launch-facts">
        <div className="facts">
          <div className="fact">
            <span className="label">Opportunity / pairing</span>
            <span className="v">
              {pairing ? `${pairing.stockSymbol} / ${pairing.pairScore.toFixed(1)}` : "STANDBY"}
            </span>
          </div>
          <div className="fact">
            <span className="label">Pre-launch checks</span>
            <span className="v">
              {passedChecks} / {launch.policyChecks.length} passed
            </span>
          </div>
          <div className="fact">
            <span className="label">Guardian approval</span>
            <span className="v">{launch.guardianRequirement.status}</span>
          </div>
          <div className="fact">
            <span className="label">Transaction</span>
            <span className="v accent">TX / {launch.transactionState.replaceAll("_", " ")}</span>
          </div>
        </div>
        <div className="perm">
          <div>
            <span className="label">Agent can</span>
            <ul>
              <li>Deploy the approved token template</li>
              <li>Initialise an approved pool</li>
              <li>Call the approved launch function</li>
            </ul>
          </div>
          <div>
            <span className="label">Agent cannot</span>
            <ul className="no">
              <li>Make arbitrary transfers</li>
              <li>Withdraw treasury</li>
              <li>Change launch parameters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemorySummary({ agent, memory }: { agent: AgentRuntime; memory: MemoryRecord[] }) {
  return (
    <div className="app-memory-layout">
      <div className="app-memory-stats">
        <span className="label">Cycle {formatCycle(agent.activeCycle)} / retained evidence</span>
        <strong>{memory.length}</strong>
        <p>Observable memory records retained for audit across the current decision loop.</p>
        <Link className="side-cta" href="/memory">
          Open memory workspace →
        </Link>
      </div>
      <div className="memory-log" aria-label="Recent agent memory">
        {memory.slice(0, 5).map((record) => (
          <div key={record.id}>
            <span className="label">
              {formatClock(record.timestamp)} / {record.eventType}
            </span>
            <b>{record.subject}</b>
            <span>
              {record.previousState} → {record.currentState}
            </span>
            <small>{record.summary}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
