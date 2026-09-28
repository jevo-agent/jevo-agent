"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { DecisionPlane } from "@/components/landing/DecisionPlane";
import { LandingScroll } from "@/components/landing/LandingScroll";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { formatClock, formatCountdown, formatCycle } from "@/lib/format";
import { groupMemoryRecords } from "@/lib/memory/grouping";
import type { AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";
import { selectFeaturedPairing } from "@/lib/pairings";
import { isJevoDemoMode } from "@/lib/api/client";

interface LandingPageProps {
  agent: AgentRuntime;
  assets: Stock[];
  ranking: string[];
  pairings: Pairing[];
  launch: Launch | null;
  memory: MemoryRecord[];
  featuredAsset: Stock;
  featuredPairing: Pairing | null;
}
type PairCandidate = {
  symbol: string;
  score: number;
  label: string;
  pairing?: Pairing;
};
type FactorPhase = "idle" | "out" | "in";
type AgentStoryStage = 0 | 1 | 2 | 3;

export function LandingPage(data: LandingPageProps) {
  const isDemoMode = isJevoDemoMode();
  const featuredSelection = useMemo(
    () => selectFeaturedPairing(data.pairings, data.featuredAsset?.symbol),
    [data.pairings, data.featuredAsset?.symbol],
  );
  const featuredPairing = featuredSelection.pairing ?? data.featuredPairing;

  return (
    <LandingScroll>
      <div className="landing-progress" aria-hidden="true" />
      <LandingHeader />
      <main>
        <LandingHero
          agent={data.agent}
          asset={data.featuredAsset}
          assets={data.assets}
          pairing={featuredPairing}
          pairings={data.pairings}
          launch={data.launch}
        />
        <CoreFeaturesSection />
        <LatestScanSection
          agent={data.agent}
          assets={data.assets}
          isDemoMode={isDemoMode}
        />
        <AgentSection
          agent={data.agent}
          asset={data.featuredAsset}
          pairing={featuredPairing}
        />
        <OpportunitySection
          assets={data.assets}
          ranking={data.ranking}
          cycle={data.agent.activeCycle}
        />
        {featuredPairing ? (
          <PairingSection
            pairing={featuredPairing}
            pairings={data.pairings}
            asset={data.assets.find((asset) => asset.symbol === featuredPairing?.stockSymbol) ?? data.featuredAsset}
          />
        ) : (
          <LandingPairingStandbySection
            agent={data.agent}
            assets={data.assets}
            featuredAsset={data.featuredAsset}
          />
        )}
        {data.launch && featuredPairing ? (
          <PipelineSection
            launch={data.launch}
            pairing={featuredPairing}
            asset={data.assets.find((asset) => asset.symbol === featuredPairing?.stockSymbol) ?? data.featuredAsset}
          />
        ) : (
          <LandingPipelineStandbySection
            agent={data.agent}
            asset={data.featuredAsset}
          />
        )}
        <MemorySection
          asset={data.featuredAsset}
          memory={data.memory}
          agent={data.agent}
        />
        <FinalSection asset={data.featuredAsset} />
        <LandingFooter agent={data.agent} />
      </main>
    </LandingScroll>
  );
}


const PAIRING_FORMULA_COMPONENTS = [
  { key: "narrative", label: "Narrative Momentum", weight: 20 },
  { key: "meme", label: "Meme Concept Attention", weight: 20 },
  { key: "cultural", label: "Cultural Alignment", weight: 15 },
  { key: "crypto", label: "Crypto Adjacency", weight: 15 },
  { key: "timing", label: "Market Timing", weight: 15 },
  { key: "stockRelevance", label: "Stock Relevance", weight: 15 },
] as const;

function LandingPairingStandbySection({
  agent,
  assets,
  featuredAsset,
}: {
  agent: AgentRuntime;
  assets: Stock[];
  featuredAsset: Stock;
}) {
  const topCandidates = assets.slice(0, 3);

  return (
    <section className="section" id="pairings">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">03 / Stock × meme pairing</p>
            <h2 className="h2 text-4xl!">
              One stock. <br /> Multiple <em>cultural expressions.</em>
            </h2>
          </div>
          <p className="body">
            Rank alone never picks the meme. JEV continuously screens top-ranked equity tokens against cultural meme concepts. When no candidate achieves dual-threshold convergence in the active cycle, the engine maintains disciplined standby.
          </p>
        </div>

        {/* Operational Telemetry Banner */}
        <div className="landing-standby-banner">
          <div className="landing-standby-header">
            <div className="landing-standby-badge">
              <span className="live-dot" aria-hidden="true" />
              <span>JEV EVALUATION ACTIVE · MEME CONVERGENCE STANDBY</span>
            </div>
            <span className="label">THRESHOLD: RANK ≤ 3 OR PROMOTE</span>
            <span className="label">CYCLE {formatCycle(agent.activeCycle)} · 0 PROPOSALS PUBLISHED</span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="landing-standby-grid">
          {/* Left: Architecture & 6-Component Deterministic Formula */}
          <div className="landing-standby-column">
            <div className="landing-standby-card">
              <span className="label">01 / QUALIFICATION GATE</span>
              <h4>Top 3 Rank or Explicit PROMOTE</h4>
              <p>
                Underlying equity tokens must hold rank #01–#03 or receive an explicit qualitative PROMOTE decision from JEV. Currently tracking {featuredAsset.symbol} (#{String(featuredAsset.currentRank).padStart(2, "0")}) and monitored equity assets.
              </p>
            </div>

            <div className="landing-standby-card">
              <div className="landing-card-header">
                <span className="label">02 / PAIRING SCORE FORMULA</span>
                <span className="label">DETERMINISTIC 6-DIMENSION MODEL</span>
              </div>
              <h4>Arithmetic Composite (0–100)</h4>
              <p>
                JEV evaluates 6 qualitative dimensions; the composite pairing score is calculated deterministically with fixed arithmetic weights:
              </p>
              <div className="landing-formula-grid">
                {PAIRING_FORMULA_COMPONENTS.map((comp) => (
                  <div key={comp.key} className="landing-formula-pill">
                    <span className="landing-pill-name">{comp.label}</span>
                    <b className="landing-pill-weight">{comp.weight}%</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-standby-card">
              <span className="label">03 / OPERATOR CURATION GATE</span>
              <h4>Mandatory Manual Review</h4>
              <p>
                All pairing proposals enter as <b>AGENT_PROPOSED</b>. Autonomous deployment without explicit human operator approval is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Right: Monitored Assets Radar & 4-Pillar Thesis Blueprint */}
          <div className="landing-standby-column">
            <div className="landing-standby-card">
              <div className="landing-card-header">
                <span className="label">MONITORED EQUITY PIPELINE</span>
                <span className="label">AWAITING MEME MATCH</span>
              </div>
              <div className="landing-candidate-list">
                {topCandidates.map((asset) => (
                  <div key={asset.symbol} className="landing-candidate-row">
                    <div className="landing-candidate-rank">
                      #{String(asset.currentRank).padStart(2, "0")}
                    </div>
                    <div className="landing-candidate-main">
                      <div className="landing-candidate-title">
                        <b>{asset.symbol}</b>
                        <span>{asset.name.replace(" Stock Token", "")}</span>
                      </div>
                      <span className="landing-candidate-status">
                        ● Scanning for Meme Concept
                      </span>
                    </div>
                    <div className="landing-candidate-score">
                      <span className="label">SCORE</span>
                      <b>{asset.opportunityScore.toFixed(1)}</b>
                    </div>
                    <Link
                      href={`/stock/${asset.symbol}`}
                      className="landing-candidate-link"
                      aria-label={`Inspect ${asset.symbol} signals`}
                    >
                      Audit signals ↗
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-standby-card">
              <div className="landing-card-header">
                <span className="label">PAIRING THESIS ARCHITECTURE</span>
                <span className="label">4 KEY CRITERIA</span>
              </div>
              <div className="landing-blueprint-grid">
                <div className="landing-blueprint-item">
                  <span className="label">01 / WHY STOCK</span>
                  <h5>Equity Momentum</h5>
                  <p>Real-world liquidity volume and macroeconomic narrative acceleration.</p>
                </div>
                <div className="landing-blueprint-item">
                  <span className="label">02 / WHY MEME</span>
                  <h5>Cultural Resonance</h5>
                  <p>Viral attention velocity, community depth, and crypto-native sentiment.</p>
                </div>
                <div className="landing-blueprint-item">
                  <span className="label">03 / WHY PAIR</span>
                  <h5>Thematic Synergy</h5>
                  <p>Narrative cohesion and cross-market attention reflexivity.</p>
                </div>
                <div className="landing-blueprint-item">
                  <span className="label">04 / WHY NOW</span>
                  <h5>Timing & Density</h5>
                  <p>Urgent catalyst convergence and optimal launch liquidity window.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Footer */}
        <div className="landing-standby-foot">
          <span className="label">
            Pairing theses generate autonomously each cycle when dual-threshold criteria are satisfied.
          </span>
          <Link className="btn btn-sm" href="/pairing">
            Explore pairing marketplace →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CoreFeaturesSection() {
  return (
    <section className="section core-features-section" id="features">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">CORE CAPABILITIES // PROTOCOL PILLARS</p>
            <h2 className="h2">
              Five core systems.
              <br />
              One <em>autonomous protocol.</em>
            </h2>
          </div>
          <p className="body">
            Grounded in verifiable state transitions, continuous market observation, and policy-bounded decision architecture.
          </p>
        </div>

        <div className="core-features-grid">
          <div className="core-feature-card">
            <div className="card-top">
              <span className="card-num">01</span>
              <span className="card-badge">OBSERVE</span>
            </div>
            <h3>Autonomous Scan &amp; Ranking</h3>
            <p>
              Continuously ingests US equity signals and Stock Tokens to dynamically rank opportunities by market pairability rather than speculative returns.
            </p>
            <Link className="card-link" href="/app">
              Explore Ranking →
            </Link>
          </div>

          <div className="core-feature-card highlight-card">
            <div className="card-top">
              <span className="card-num">02</span>
              <span className="card-badge highlight">DECIDE</span>
            </div>
            <h3>Jev Decisions with Confidence</h3>
            <p>
              Operates a dedicated server-side decision engine outputting typed classifications (PROMOTE, HOLD, DEMOTE) with explicit confidence scores.
            </p>
            <Link className="card-link" href="/jev">
              About Jev →
            </Link>
          </div>

          <div className="core-feature-card">
            <div className="card-top">
              <span className="card-num">03</span>
              <span className="card-badge">PAIR</span>
            </div>
            <h3>Independent Pairing Thesis</h3>
            <p>
              Synthesizes real equity momentum with decentralized culture to formulate creative, thematic Stock × Meme pairing hypotheses.
            </p>
            <Link className="card-link" href="/pairing">
              View Pairings →
            </Link>
          </div>

          <div className="core-feature-card">
            <div className="card-top">
              <span className="card-num">04</span>
              <span className="card-badge">GATE</span>
            </div>
            <h3>Human-Gated Controlled Launch</h3>
            <p>
              Enforces a strict 6-stage countdown and 8 pre-flight policy gates where no token deploys without explicit operator approval.
            </p>
            <Link className="card-link" href="/launch">
              Launch Pipeline →
            </Link>
          </div>

          <div className="core-feature-card">
            <div className="card-top">
              <span className="card-num">05</span>
              <span className="card-badge">AUDIT</span>
            </div>
            <h3>Full Memory &amp; Audit Trail</h3>
            <p>
              Persists cryptographically auditable cycle histories, rank transitions, and memory snapshots across every evaluation loop.
            </p>
            <Link className="card-link" href="/memory">
              Inspect Memory →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LatestScanSection({
  agent,
  assets,
  isDemoMode,
}: {
  agent: AgentRuntime;
  assets: Stock[];
  isDemoMode?: boolean;
}) {
  const topAssets = assets.slice(0, 5);
  const events = agent.latestEvents.slice(0, 4);

  return (
    <section className="section latest-scan-section" id="latest-scan">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">LIVE SURVEILLANCE // 00 · LATEST SCAN &amp; DECISION FEED</p>
            <h2 className="h2">
              Continuous scan telemetry
              <br />
              and <em>Jev decision stream.</em>
            </h2>
          </div>
          <div className="scan-head-meta">
            <span className="scan-mode-badge">
              {isDemoMode ? "DEMO DATA" : "PHASE 0 · SIMULATED DECISIONS"}
            </span>
            <p className="body">
              Observation loop runs on scheduled and delta scans across the Stock Token universe.
              Telemetry feeds directly into Jev classification and opportunity re-ranking.
            </p>
          </div>
        </div>

        {/* Telemetry Status Strip */}
        <div className="scan-telemetry-strip" aria-label="Latest scan telemetry">
          <div className="telemetry-cell">
            <span className="label">ACTIVE CYCLE</span>
            <span className="val">{formatCycle(agent.activeCycle)}</span>
          </div>
          <div className="telemetry-cell">
            <span className="label">SCAN RECENCY</span>
            <span className="val">{agent.lastDecisionAgeSeconds}s ago</span>
          </div>
          <div className="telemetry-cell">
            <span className="label">ASSETS EVALUATED</span>
            <span className="val">
              {agent.assetsScanned} / {agent.assetsInUniverse ?? assets.length} in universe
            </span>
          </div>
          <div className="telemetry-cell">
            <span className="label">JEV ENGINE STATE</span>
            <span className={`val ${agent.jevStatus === "ACTIVE" ? "on" : "standby"}`}>
              {agent.jevStatus === "ACTIVE" ? (
                <>
                  <span className="dot on pulse" aria-hidden="true" /> ACTIVE · {agent.currentOperation}
                </>
              ) : (
                <>
                  <span className="dot off" aria-hidden="true" /> JEV STANDBY
                </>
              )}
            </span>
          </div>
        </div>

        <div className="scan-dual-grid">
          {/* Top Ranked Assets Strip */}
          <div className="scan-assets-col">
            <div className="scan-col-head">
              <h3>TOP SCANNED ASSETS</h3>
              <span className="label">RANKED BY OPPORTUNITY</span>
            </div>
            <div className="scan-assets-list">
              {topAssets.length === 0 ? (
                <div className="scan-empty">No assets scanned in current cycle.</div>
              ) : (
                topAssets.map((asset) => (
                  <Link
                    key={asset.symbol}
                    href={`/stock/${asset.symbol}`}
                    className="scan-asset-row"
                  >
                    <div className="asset-left">
                      <span className="asset-rank">#{String(asset.currentRank).padStart(2, "0")}</span>
                      <span className="asset-sym">{asset.symbol}</span>
                    </div>
                    <div className="asset-center">
                      <span className={`decision-pill pill-${asset.jevDecision.toLowerCase()}`}>
                        {asset.jevDecision.replaceAll("_", " ")}
                      </span>
                      <span className="confidence-pill">
                        {asset.confidence === null ? "—" : `${asset.confidence}% conf`}
                      </span>
                    </div>
                    <div className="asset-right">
                      <span className="score-val">{asset.opportunityScore.toFixed(1)}</span>
                      <span className="label">SCORE</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Jev Decision Feed & Event Log */}
          <div className="scan-feed-col">
            <div className="scan-col-head">
              <h3>JEV DECISION FEED</h3>
              <span className="label">REAL-TIME EVALUATION STREAM</span>
            </div>

            <div className="jev-feed-list">
              {topAssets.map((asset) => (
                <div key={`feed-${asset.symbol}`} className="jev-feed-item">
                  <div className="feed-item-top">
                    <span className="feed-sym">{asset.symbol}</span>
                    <span className={`decision-badge badge-${asset.jevDecision.toLowerCase()}`}>
                      {asset.jevDecision.replaceAll("_", " ")}
                    </span>
                    <span className="feed-conf">
                      {asset.confidence === null ? "—" : `${asset.confidence}% confidence`}
                    </span>
                    <span className="feed-age">{agent.lastDecisionAgeSeconds}s ago</span>
                  </div>
                  <p className="feed-thesis" title={asset.decisionTrace[0]?.summary ?? `${asset.symbol} evaluated in cycle`}>
                    {asset.decisionTrace[0]?.summary ?? `${asset.name} evaluated in cycle with ${asset.jevDecision.toLowerCase()} conviction.`}
                  </p>
                </div>
              ))}
            </div>

            {/* Protocol Events Log */}
            {events.length > 0 ? (
              <div className="scan-events-sub">
                <div className="scan-events-head">
                  <span className="label">RECENT PROTOCOL EVENTS</span>
                </div>
                <div className="scan-events-list">
                  {events.map((evt) => (
                    <div key={evt.id} className="scan-event-row">
                      <span className="event-type">{evt.type}</span>
                      <span className="event-subject">{evt.subject}</span>
                      <span className="event-summary">{evt.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const EIGHT_POLICY_GATES = [
  { id: "policy-stock", label: "Valid Stock Token", desc: "Canonical asset identity verified on Robinhood Chain." },
  { id: "policy-pair", label: "Approved Pairing Asset", desc: "Pairing asset permitted by protocol policy boundaries." },
  { id: "policy-metadata", label: "Token Metadata", desc: "Token name, ticker symbol, and metadata payload valid." },
  { id: "policy-contract", label: "Contract Parameters", desc: "Launch parameters within Phase 0 permission boundaries." },
  { id: "policy-limits", label: "Launch Limits", desc: "Initial liquidity limits and volume thresholds respected." },
  { id: "policy-duplicate", label: "Duplicate Check", desc: "Collision verification; no duplicate active tokens." },
  { id: "policy-permission", label: "Agent Permission", desc: "Scoped executor permissions valid for approved action." },
  { id: "policy-simulation", label: "Transaction Simulation", desc: "Zero-revert preflight simulation verified." },
] as const;

const STANDBY_PIPELINE_STAGES = [
  { id: "CANDIDATE_SELECTED", point: "T-24H", desc: "Opportunity and pair thesis locked for launch review." },
  { id: "NARRATIVE_VALIDATION", point: "T-18H", desc: "Narrative pressure and why-now context verified above launch threshold." },
  { id: "PAIRING_VALIDATION", point: "T-12H", desc: "Pairing score, metadata, Stock Token identity, and policy constraints validated." },
  { id: "CONTRACT_PREPARATION", point: "T-06H", desc: "Approved launch parameters assembled for Launch Executor and Pons adapter." },
  { id: "FINAL_POLICY_CHECK", point: "T-01H", desc: "Permissions, transaction simulation, launch limits, and guardian approval verified." },
  { id: "CONTROLLED_EXECUTION", point: "T-00", desc: "Approved action submitted through restricted Launch Executor." },
];

function LandingPipelineStandbySection({
  agent,
  asset,
}: {
  agent: AgentRuntime;
  asset: Stock;
}) {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);

  return (
    <section className="section" id="pipeline">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">04 / Autonomous Launch Pipeline</p>
            <h2 className="h2">
              Autonomous launch.
              <br />
              <em>Policy-bounded &amp; operator-gated.</em>
            </h2>
            <div className="pipeline-phase-badge">
              PHASE 0 · NO ON-CHAIN EXECUTION
            </div>
          </div>
          <p className="body">
            Autonomous by design, policy-bounded, operator-gated in Phase 0. The agent can only execute pre-approved actions through an 8-gate policy contract. When no pairing proposal has been approved and scheduled by the operator, execution remains strictly locked in standby.
          </p>
        </div>

        {/* 6-Stage Lifecycle Stepper */}
        <ol className="stages">
          {STANDBY_PIPELINE_STAGES.map((source, index) => (
            <li
              key={source.id}
              className={`stage ${selectedStageIndex === index ? "inspect" : ""}`}
            >
              <button
                type="button"
                className="stage-control"
                aria-current={selectedStageIndex === index ? "step" : undefined}
                aria-pressed={selectedStageIndex === index}
                onClick={() => setSelectedStageIndex(index)}
              >
                <span className="state">Standby · {source.point}</span>
                <h3>{source.id.replaceAll("_", " ")}</h3>
                <p>{source.desc}</p>
              </button>
            </li>
          ))}
        </ol>

        {/* Split Grid */}
        <div className="pipe-grid">
          <div className="pipeline-timeline">
            <p className="label">
              Next agent launch / <b>STANDBY (AWAITING PROPOSAL)</b>
            </p>
            <div className="clock">
              STANDBY
            </div>
            <p className="label">Simulated 24h verification sequence / phase 0 · cycle {formatCycle(agent.activeCycle)}</p>
            <ol className="cycle">
              {STANDBY_PIPELINE_STAGES.map((stage, index) => (
                <li
                  key={stage.id}
                  className={selectedStageIndex === index ? "inspect" : ""}
                >
                  <span className="t">{stage.point}</span>
                  <span>{stage.desc}</span>
                  <span className="s">Standby</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="pipeline-policy">
            <div className="facts">
              <div className="fact">
                <span className="label">Opportunity / pairing</span>
                <span className="v">{asset.symbol} ({asset.opportunityScore.toFixed(1)}) / STANDBY</span>
              </div>
              <div className="fact">
                <span className="label">Pre-launch checks</span>
                <span className="v">0 / 8 passed (Standby)</span>
              </div>
              <div className="fact">
                <span className="label">Pairing asset</span>
                <span className="v">Awaiting operator-approved pairing</span>
              </div>
              <div className="fact">
                <span className="label">Agent wallet</span>
                <span className="v">Awaiting candidate / Scoped policy rules</span>
              </div>
              <div className="fact">
                <span className="label">Guardian approval</span>
                <span className="v">Mandatory gate / Not scheduled</span>
              </div>
              <div className="fact">
                <span className="label">Transaction</span>
                <span className="v accent">No execution in standby</span>
              </div>
            </div>

            <div className="pipeline-gates-wrap">
              <span className="label">PRE-LAUNCH POLICY GATES (8 GATES) / STANDBY PREVIEW</span>
              <div className="pipeline-gates-grid">
                {EIGHT_POLICY_GATES.map((gate) => (
                  <div key={gate.id} className="policy-gate-card">
                    <div className="gate-top">
                      <span className="gate-label">{gate.label}</span>
                      <span className="gate-status">○ Standby</span>
                    </div>
                    <p className="gate-desc">{gate.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="perm">
              <Permission
                title="Agent can"
                items={[
                  "Deploy the approved token template",
                  "Initialise an approved pool",
                  "Call the approved launch function",
                ]}
              />
              <Permission
                title="Agent cannot"
                items={[
                  "Make arbitrary transfers",
                  "Make arbitrary contract calls",
                  "Withdraw treasury",
                  "Change ownership",
                  "Change launch parameters outside policy",
                ]}
                restricted
              />
            </div>
          </div>
        </div>

        <div className="pipeline-link">
          <Link className="btn btn-sm" href="/launch">
            Open launch pipeline →
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingHero({
  agent,
  asset,
  assets,
  pairing,
  pairings,
  launch,
}: {
  agent: AgentRuntime;
  asset: Stock;
  assets?: Stock[];
  pairing: Pairing | null;
  pairings?: Pairing[];
  launch: Launch | null;
}) {
  const cleanCycleId =
    String(agent.activeCycle ?? "").replace(/^cycle[-_\s]*/i, "") || "—";

  return (
    <section className="hero" id="top">
      <div className="hero-frame">
        <HeroEdgeUtilities />
        <div className="hero-copy">
          <p className="label hero-plane-meta">
            <b>JEVO / Decision plane</b>
            <span title={String(agent.activeCycle ?? "")}>
              cycle {cleanCycleId}
            </span>
          </p>
          <p className="label">Autonomous market intelligence protocol</p>
          <h1>
            <span>The autonomous</span>
            <span>market agent</span>
            <span>
              for <em>stock × meme</em>
            </span>
            <span>markets.</span>
          </h1>
          <p className="body">
            JEVO uses the JEV AI model to evaluate market signals, rank
            opportunities, and discover the next stock × meme markets.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open app →
            </Link>
            <Link className="btn" href={asset ? `/stock/${asset.symbol}` : "/app#opportunities"}>
              View current opportunity ↗
            </Link>
          </div>
          <p className="hero-copy-note">
            State → Jev → Decision → Action <span>Phase 0</span>
          </p>
        </div>
        <DecisionPlane asset={asset} assets={assets} pairing={pairing} allPairings={pairings} launch={launch} />
      </div>
      <div className="hero-status">
        <div className="wrap">
          <div className="cell">
            <div className="label">Jev</div>
            <div className="label">
              <b className={agent.status === "ONLINE" ? "on" : undefined}>
                {agent.status === "ONLINE" ? "Active" : "Standby"}
              </b>
            </div>
          </div>
          <div className="cell">
            <div className="label">Cycle</div>
            <div className="label" title={String(agent.activeCycle ?? "")}>
              <b>{cleanCycleId}</b> / last decision{" "}
              <b>
                {agent.lastDecisionAgeSeconds !== null &&
                agent.lastDecisionAgeSeconds !== undefined
                  ? `${agent.lastDecisionAgeSeconds}s`
                  : "—"}
              </b>{" "}
              ago
            </div>
          </div>
          <div className="cell">
            <div className="label">Network</div>
            <div className="label">
              <b>
                {agent.networkLabel && agent.networkLabel !== "UNAVAILABLE"
                  ? agent.networkLabel
                  : "TARGET ROBINHOOD CHAIN · CONNECTION —"}
              </b>
            </div>
          </div>
          <div className="cell">
            <div className="label">State</div>
            <div className="label">
              <b>{agent.currentOperation ? agent.currentOperation : "Decision loop"}</b>
            </div>
          </div>
          <a className="label scroll-hint" href="#core-features">
            Scroll to inspect ↓
          </a>
        </div>
      </div>
    </section>
  );
}

function HeroEdgeUtilities() {
  return (
    <>
      <div
        className="hero-edge-rail hero-edge-rail-left"
        aria-label="JEVO hero system metadata"
      >
        JEVO / AGENT&nbsp;&nbsp;/&nbsp;&nbsp;JEV /
        DECISION&nbsp;&nbsp;/&nbsp;&nbsp;SYS.9841
      </div>
      <div className="hero-edge-rail hero-edge-rail-right" aria-hidden="true">
        AUTONOMOUS // JEV // AGENT&nbsp;&nbsp;/&nbsp;&nbsp;INTERFACE: ONLINE
      </div>
    </>
  );
}

const AGENT_STORY_STAGES = [
  {
    index: "01",
    title: "OBSERVE MARKET SIGNALS",
    copy: "Stock Token prices, volume, news, social velocity and narrative clusters are ingested on scheduled and event-driven scans.",
    status: "DELTA SCAN / 60S",
  },
  {
    index: "02",
    title: "JEV EVALUATES STATE",
    copy: "The JEV AI model evaluates structured market state and returns bounded choices, scores and classifications.",
    status: "BOUNDED DECISIONS",
  },
  {
    index: "03",
    title: "RANK OPPORTUNITIES",
    copy: "Signals combine into an opportunity score. It measures pairability, not expected returns.",
    status: "RANKING / 5 MIN",
  },
  {
    index: "04",
    title: "ADVANCE QUALIFIED PAIRS",
    copy: "Qualified pairs move into a policy-checked launch review without implying execution.",
    status: "1 LAUNCH CANDIDATE",
  },
] as const;

function AgentSection({
  agent,
  asset,
  pairing,
}: {
  agent: AgentRuntime;
  asset: Stock;
  pairing: Pairing | null;
}) {
  const stageRefs = useRef<Array<HTMLElement | null>>([]);
  const routerRef = useRef<HTMLDivElement | null>(null);
  const [activeStage, setActiveStage] = useState<AgentStoryStage>(0);
  const [revealedBlocks, setRevealedBlocks] = useState<string[]>([]);
  const [observerReady, setObserverReady] = useState(false);

  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observed = [...stageRefs.current, routerRef.current].filter(
      (element): element is HTMLElement => Boolean(element),
    );
    if (observed.length === 0) return;
    setObserverReady(true);
    const observer = new IntersectionObserver(
      (entries) => {
        const nearest = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              Math.abs(
                left.boundingClientRect.top +
                  left.boundingClientRect.height / 2 -
                  window.innerHeight / 2,
              ) -
              Math.abs(
                right.boundingClientRect.top +
                  right.boundingClientRect.height / 2 -
                  window.innerHeight / 2,
              ),
          )[0];
        if (!nearest) return;
        const block = nearest.target.getAttribute("data-agent-block");
        if (!block) return;
        setRevealedBlocks((current) =>
          current.includes(block) ? current : [...current, block],
        );
        setActiveStage(
          block === "router" ? 3 : (Number(block) as AgentStoryStage),
        );
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    observed.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className={`section agent-story ${observerReady ? "is-observer-ready" : ""}`}
      id="agent"
    >
      <div className="wrap">
        <div className="agent-story-grid">
          <aside className="agent-story-left">
            <div className="agent-story-left-sticky">
              <p className="label sec-index">01 / The agent</p>
              <h2 className="h2">
                Most AI is built to talk.
                <br />
                JEVO is built to <em>decide.</em>
              </h2>
              <div
                className="contrast"
                aria-label="Traditional LLM versus JEVO"
              >
                <div className="contrast-row">
                  <span className="label">Typical LLM</span>
                  <span className="chainline">
                    INPUT → REASON → GENERATE TEXT
                  </span>
                </div>
                <div className="contrast-row jevo">
                  <span className="label">
                    <span className="on">JEVO</span>
                  </span>
                  <span className="chainline">
                    STATE → <em>JEV</em> → DECISION → ACTION
                  </span>
                </div>
                <div className="contrast-row">
                  <span className="label">Output</span>
                  <span className="chainline output-line">
                    {asset.jevDecision.replaceAll("_", " ")} {asset.symbol} / {asset.previousRank === null ? "UNAVAILABLE" : `#${String(asset.previousRank).padStart(2, "0")}`} → #{String(asset.currentRank).padStart(2, "0")} / CONF{" "}
                    {asset.confidence === null ? "—" : asset.confidence / 100}
                  </span>
                </div>
              </div>
            </div>
          </aside>
          <div className="agent-story-right">
            {AGENT_STORY_STAGES.map((_, index) => {
              const block = String(index);
              return (
                <section
                  className={`agent-stage-block ${revealedBlocks.includes(block) ? "is-revealed" : ""}`}
                  data-agent-block={block}
                  key={block}
                  ref={(element) => {
                    stageRefs.current[index] = element;
                  }}
                >
                  <AgentStoryStagePanel
                    asset={asset}
                    pairing={pairing}
                    stage={index as AgentStoryStage}
                  />
                </section>
              );
            })}
            <div
              className={`agent-router-block ${revealedBlocks.includes("router") ? "is-revealed" : ""} ${activeStage === 3 ? "is-active" : ""}`}
              data-agent-block="router"
              ref={routerRef}
            >
              <AgentDecisionRouter
                stage={activeStage}
                agent={agent}
                asset={asset}
                pairing={pairing}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentStoryStagePanel({
  asset,
  pairing,
  stage,
}: {
  asset: Stock;
  pairing: Pairing | null;
  stage: AgentStoryStage;
}) {
  const detail = AGENT_STORY_STAGES[stage];
  return (
    <article className="agent-stage-panel">
      <div className="agent-stage-heading">
        <div>
          <span className="label">[{detail.index}]</span>
          <h3>{detail.title}</h3>
        </div>
        <span className="label">{detail.status}</span>
      </div>
      <p className="agent-stage-copy">{detail.copy}</p>
      {stage === 0 && (
        <div className="agent-observe-flow" aria-label="Observed market inputs">
          {[
            "STOCK TOKEN STATE",
            "MARKET",
            "NARRATIVE",
            "SOCIAL / CULTURAL",
          ].map((input) => (
            <span key={input}>{input}</span>
          ))}
        </div>
      )}
      {stage === 1 && (
        <div className="agent-evaluate-node">
          <Image src="/logo.png" alt="" width={28} height={28} />
          <div>
            <span className="label">JEV AI MODEL</span>
            <strong>DECISION ENGINE</strong>
          </div>
          <span className="label">CHOICES / SCORES / CLASSIFICATIONS</span>
        </div>
      )}
      {stage === 2 && (
        <div className="agent-stage-outcome">
          <span className="label">OPPORTUNITY RANK</span>
          <strong>{asset.symbol}</strong>
          <b>{asset.previousRank === null ? "UNAVAILABLE" : `#${String(asset.previousRank).padStart(2, "0")}`} → #{String(asset.currentRank).padStart(2, "0")}</b>
          <span className="agent-stage-score">
            {asset.opportunityScore.toFixed(1)}
          </span>
          <span className="agent-stage-decision">PROMOTE</span>
        </div>
      )}
      {stage === 3 && pairing ? (
        <div className="agent-stage-outcome agent-stage-pair">
          <span className="label">PAIRING THESIS</span>
          <strong>
            {asset.symbol} × {pairing.symbol}
          </strong>
          <b>
            {pairing.pairScore.toFixed(1)} /{" "}
            {pairing.jevDecision.replaceAll("_", " ")}
          </b>
          <span className="label">LAUNCH CANDIDATE</span>
          <span className="agent-stage-state">TX / NOT SUBMITTED</span>
        </div>
      ) : stage === 3 ? (
        <div className="agent-stage-outcome agent-stage-pair">
          <span className="label">PAIRING THESIS</span>
          <strong>NO QUALIFIED PAIRING</strong>
          <span className="agent-stage-state">THIS CYCLE</span>
        </div>
      ) : null}
    </article>
  );
}

function AgentDecisionRouter({
  stage,
  agent,
  asset,
  pairing,
}: {
  stage: AgentStoryStage;
  agent: AgentRuntime;
  asset: Stock;
  pairing: Pairing | null;
}) {
  const inputNodes = [
    ["MARKET STATE", 82],
    ["NARRATIVE", 122],
    ["SOCIAL / CULTURAL", 162],
    ["STOCK TOKEN STATE", 202],
  ] as const;
  const outputNodes = [
    [
      "01 / OPPORTUNITY RANK",
      `${asset.symbol} / #${String(asset.currentRank).padStart(2, "0")} / ${asset.opportunityScore.toFixed(1)}`,
      76,
    ],
    [
      "02 / PAIRING THESIS",
      pairing ? `${asset.symbol} × ${pairing.symbol} / ${pairing.pairScore.toFixed(1)}` : "NO QUALIFIED PAIRING",
      132,
    ],
    ["03 / MEMORY EVENT", `CYCLE ${formatCycle(agent.activeCycle)}`, 188],
    ["04 / LAUNCH CANDIDATE", pairing ? "TX / NOT SUBMITTED" : "NO LAUNCH CANDIDATE", 244],
  ] as const;
  const activeOutputs = stage === 2 ? [0] : stage === 3 ? [1, 3] : [];
  return (
    <div
      className={`agent-router agent-router-stage-${stage}`}
      role="group"
      aria-label="JEV decision spine"
    >
      <div className="agent-router-meta">
        <span className="label">JEV DECISION SPINE / INPUTS → ACTIONS</span>
        <span className="label">CYCLE {formatCycle(agent.activeCycle)}</span>
      </div>
      <div
        className="agent-router-field"
        aria-label="Market state compresses into the JEV decision node and travels along a structured action bus"
      >
        <div className="agent-router-column-labels" aria-hidden="true">
          <span>INPUT CHANNELS</span>
          <span>JEV / DECISION SPINE</span>
          <span>ACTION REGISTER</span>
        </div>
        <div className="agent-router-body">
          <div className="agent-router-input-list">
            {inputNodes.map(([label], index) => (
              <div
                className={`agent-router-input-row ${stage === 0 ? "is-active" : ""}`}
                key={label}
              >
                <span className="agent-router-input-index">0{index + 1}</span>
                <span className="agent-router-input-name">{label}</span>
                <span className="agent-router-input-line" aria-hidden="true" />
              </div>
            ))}
          </div>
          <div
            className={`agent-router-compression ${stage === 1 ? "is-active" : ""}`}
            aria-hidden="true"
          >
            <span className="agent-router-compression-caption">COMPRESS</span>
            <span className="agent-router-compression-line" />
            <span className="agent-router-compression-line" />
            <span className="agent-router-compression-line" />
            <span className="agent-router-compression-line" />
          </div>
          <div
            className={`agent-router-center ${stage === 1 ? "is-active" : ""}`}
          >
            <div className="agent-router-jev-node">
              <span className="agent-router-logo-marker">
                <Image
                  className="agent-router-logo"
                  src="/logo.png"
                  alt=""
                  width={30}
                  height={30}
                />
              </span>
              <span className="agent-router-jev-copy">
                <strong>JEV</strong>
                <span>DECISION NODE</span>
                <small>BOUNDED OUTPUT</small>
              </span>
            </div>
            <span
              className={`agent-router-bus ${stage >= 2 ? "is-active" : ""}`}
              aria-hidden="true"
            >
              <span className="agent-router-signal" />
            </span>
          </div>
          <div className="agent-router-output-list">
            {outputNodes.map(([label, value], index) => (
              <div
                className={`agent-router-output-row ${activeOutputs.includes(index) ? "is-active" : ""}`}
                key={label}
              >
                <span className="agent-router-output-tick" aria-hidden="true" />
                <span className="agent-router-output-copy">
                  <strong>{label}</strong>
                  <small>{value}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className="sr-only">
        <li>
          Market state, narrative, social and cultural signals, and stock token
          state compress into the JEV decision node.
        </li>
        <li>
          Opportunity rank: {asset.symbol} / #
          {String(asset.currentRank).padStart(2, "0")} /{" "}
          {asset.opportunityScore.toFixed(1)}.
        </li>
        <li>{pairing ? `Pairing thesis: ${asset.symbol} × ${pairing.symbol} / ${pairing.pairScore.toFixed(1)}.` : "No qualified pairing was published for this cycle."}</li>
        <li>Memory event: cycle {formatCycle(agent.activeCycle)}.</li>
        <li>{pairing ? "Launch candidate: transaction not submitted." : "No launch candidate was published for this cycle."}</li>
      </ul>
    </div>
  );
}

function OpportunitySection({
  assets,
  ranking,
  cycle,
}: {
  assets: Stock[];
  ranking: string[];
  cycle: string | number | null;
}) {
  const [view, setView] = useState<"prev" | "curr">("curr");
  const rows = useMemo(
    () =>
      ranking
        .map((symbol) => assets.find((asset) => asset.symbol === symbol))
        .filter((asset): asset is Stock => Boolean(asset))
        .sort((left, right) =>
          view === "curr"
            ? left.currentRank - right.currentRank
          : (left.previousRank === null || right.previousRank === null ? 0 : left.previousRank - right.previousRank),
        ),
    [assets, ranking, view],
  );
  return (
    <section className="section" id="market">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">02 / Opportunity engine</p>
          <h2 className="h2">
              Built to <em>find</em> what
              <br />
              should exist next.
            </h2>
          </div>
          <p className="body">
            Every asset the agent evaluates is ranked by pairability. Compare
            the previous cycle with the current one to see what Jev moved, and
            open any row to inspect why.
          </p>
        </div>
        <div className="rank-tools">
          <div className="seg" role="group" aria-label="Ranking cycle">
            <button
              type="button"
              aria-pressed={view === "prev"}
              onClick={() => setView("prev")}
            >
              Previous / unavailable
            </button>
            <button
              type="button"
              aria-pressed={view === "curr"}
              onClick={() => setView("curr")}
            >
              Current / {formatCycle(cycle)}
            </button>
          </div>
          <span className="label">
            Last ranking <b>{formatCycle(cycle)}</b> / worker state
          </span>
        </div>
        <div className="rank" role="table" aria-label="JEVO opportunity rank">
          <div className="rank-head label" role="row">
            <span>Rank</span>
            <span>Asset</span>
            <span>Opportunity score</span>
            <span>Delta</span>
            <span>Jev decision</span>
            <span className="c-age">Evaluated</span>
            <span />
          </div>
          <ol className={`rank-list rank-list-${view}`}>
            {rows.map((asset) => {
              const rank =
                view === "curr" ? asset.currentRank : asset.previousRank;
              const score =
                view === "curr" ? asset.opportunityScore : asset.previousScore;
              return (
                <li key={asset.symbol}>
                  <Link
                    className={`rank-row${rank === 1 ? " top" : ""}`}
                    role="row"
                    href={`/stock/${asset.symbol}`}
                    aria-label={`Inspect ${asset.symbol} opportunity, rank ${rank ?? "unavailable"}, score ${score === null ? "unavailable" : score.toFixed(1)}`}
                  >
                    <span className="pos">{rank === null ? "—" : String(rank).padStart(2, "0")}</span>
                    <span className="asset">
                      <b>{asset.symbol}</b>
                      <span>{asset.name.replace(" Stock Token", "")}</span>
                    </span>
                    <span className="bar">
                      <span>{score === null ? "—" : score.toFixed(1)}</span>
                      <i style={{ "--w": `${score ?? 0}%` } as CSSProperties} />
                    </span>
                    <span
                      className={`delta ${view === "curr" && asset.rankMovement !== null && asset.rankMovement > 0 ? "up" : view === "curr" && asset.rankMovement !== null && asset.rankMovement < 0 ? "dn" : "flat"}`}
                    >
                      {view === "curr"
                        ? asset.rankMovement !== null && asset.rankMovement > 0
                          ? `▲ +${asset.rankMovement}`
                          : asset.rankMovement !== null && asset.rankMovement < 0
                            ? `▼ ${Math.abs(asset.rankMovement)}`
                            : "—"
                        : "—"}
                    </span>
                    <span
                      className={`dec ${view === "curr" && asset.jevDecision === "PROMOTE" ? "promote" : view === "curr" && asset.rankMovement !== null && asset.rankMovement < 0 ? "demote" : ""}`}
                    >
                      {view === "curr" ? asset.jevDecision : "—"}
                    </span>
                    <span className="age">
                      {view === "curr"
                        ? `${formatClock(asset.lastEvaluatedAt)} UTC`
                        : asset.previousRank === null ? "Cycle unavailable" : "Previous cycle"}
                    </span>
                    <span className="go">↗</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="rank-foot">
          <span className="label">
            Opportunity score is an internal pairability measure, not an
            investment-return prediction.
          </span>
          <Link className="btn btn-sm" href="/app">
            Full ranking in app →
          </Link>
        </div>
      </div>
    </section>
  );
}

function PairingSection({
  pairing,
  asset,
  pairings = [],
}: {
  pairing: Pairing;
  asset: Stock;
  pairings?: Pairing[];
}) {
  const storyRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const manualTimer = useRef<number | null>(null);
  const factorTransitionTimer = useRef<number | null>(null);
  const [scrollCandidate, setScrollCandidate] = useState(0);
  const [manualCandidate, setManualCandidate] = useState<number | null>(null);
  const [displayedCandidate, setDisplayedCandidate] = useState(0);
  const [factorPhase, setFactorPhase] = useState<FactorPhase>("idle");

  const featuredSelection = useMemo(
    () => selectFeaturedPairing(pairings.length > 0 ? pairings : [pairing], asset.symbol),
    [pairings, asset.symbol, pairing],
  );
  const effectivePairing = featuredSelection.pairing ?? pairing;
  const isTied = featuredSelection.isTied;
  const tiedCount = featuredSelection.tiedCount;

  const candidates: PairCandidate[] = useMemo(() => {
    const primary: PairCandidate = {
      symbol: effectivePairing.symbol,
      score: effectivePairing.pairScore,
      label: effectivePairing.jevDecision === "STRONG_PAIR" ? "strong pair" : effectivePairing.jevDecision.replaceAll("_", " ").toLowerCase(),
      pairing: effectivePairing,
    };
    const siblings = featuredSelection.alternatives.map((p): PairCandidate => ({
      symbol: p.symbol,
      score: p.pairScore,
      label: p.jevDecision === "STRONG_PAIR" ? "strong pair" : p.jevDecision.replaceAll("_", " ").toLowerCase(),
      pairing: p,
    }));
    const embedded = (effectivePairing.alternatives ?? [])
      .filter((alt) => alt.symbol !== effectivePairing.symbol && !siblings.some((s) => s.symbol === alt.symbol))
      .map((alt): PairCandidate => ({
        symbol: alt.symbol,
        score: alt.pairScore,
        label: "alternative",
      }));
    const all = [primary, ...siblings, ...embedded];
    const seen = new Set<string>();
    return all.filter((c) => {
      if (seen.has(c.symbol)) return false;
      seen.add(c.symbol);
      return true;
    });
  }, [effectivePairing, featuredSelection.alternatives]);

  const selectedIndex = manualCandidate ?? scrollCandidate;
  useEffect(() => {
    const section = storyRef.current;
    if (!section) return;
    let frame: number | null = null;
    const updateFromScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (window.innerWidth <= 1100) {
          setScrollCandidate(0);
          return;
        }
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        const stickyHeight =
          stickyRef.current?.getBoundingClientRect().height ??
          window.innerHeight;
        const travel = Math.max(section.offsetHeight - stickyHeight, 1);
        const progress = Math.max(
          0,
          Math.min(1, (window.scrollY - sectionTop) / travel),
        );
        const count = Math.max(candidates.length, 1);
        const nextCandidate = Math.min(
          count - 1,
          Math.floor(Math.min(progress, 0.999999) * count),
        );
        setScrollCandidate((current) =>
          current === nextCandidate ? current : nextCandidate,
        );
      });
    };
    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [candidates.length]);

  useEffect(
    () => () => {
      if (manualTimer.current !== null)
        window.clearTimeout(manualTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (selectedIndex === displayedCandidate) return;
    if (factorTransitionTimer.current !== null) {
      window.clearTimeout(factorTransitionTimer.current);
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      factorTransitionTimer.current = window.setTimeout(() => {
        setDisplayedCandidate(selectedIndex);
        setFactorPhase("idle");
        factorTransitionTimer.current = null;
      }, 0);
      return;
    }
    factorTransitionTimer.current = window.setTimeout(() => {
      setFactorPhase("out");
      factorTransitionTimer.current = window.setTimeout(() => {
        setDisplayedCandidate(selectedIndex);
        setFactorPhase("in");
        factorTransitionTimer.current = window.setTimeout(() => {
          setFactorPhase("idle");
          factorTransitionTimer.current = null;
        }, 300);
      }, 120);
    }, 0);
  }, [displayedCandidate, selectedIndex]);

  useEffect(
    () => () => {
      if (factorTransitionTimer.current !== null) {
        window.clearTimeout(factorTransitionTimer.current);
      }
    },
    [],
  );

  function selectCandidate(index: number) {
    setManualCandidate(index);
    if (manualTimer.current !== null) window.clearTimeout(manualTimer.current);
    manualTimer.current = window.setTimeout(() => {
      setManualCandidate(null);
      manualTimer.current = null;
    }, 4000);
  }

  const active = candidates[displayedCandidate] ?? candidates[0];
  const sourceCopy = active.pairing ?? pairing;
  return (
    <section className="section pairing-story" id="pairings" ref={storyRef}>
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">03 / Stock × meme pairing</p>
            <h2 className="h2 text-4xl!">
              One stock. <br /> Multiple <em>cultural expressions.</em>
            </h2>
          </div>
          <p className="body">
            Rank alone never picks the meme. Each candidate gets its own thesis:
            why this stock, why this meme, why together, why now. Select a
            candidate to compare.
          </p>
        </div>
        <div
          className="pairing-sticky"
          ref={stickyRef}
          data-active-candidate={active.symbol}
        >
          <div className="pair-grid">
            <div className="pair-map">
              <div className="pair-src">
                <span className="label">Stock Token</span>
                <b>{pairing.stockSymbol}</b>
                <span className="label">
                  Rank <b>#{String(asset.currentRank).padStart(2, "0")}</b> / {asset.opportunityScore.toFixed(1)}
                </span>
              </div>
              <div className="pair-links" aria-hidden="true">
                <svg viewBox="0 0 100 300" preserveAspectRatio="none">
                  {/* Stock origin node */}
                  <circle cx="2" cy="150" r="3" fill="var(--accent)" />
                  {candidates.map((candidate, index) => {
                    const count = Math.max(candidates.length, 1);
                    const targetY = count === 1 ? 150 : (index + 0.5) * (300 / count);
                    const isSelected = selectedIndex === index;
                    return (
                      <g key={candidate.symbol}>
                        <path
                          className={isSelected ? "on" : "off"}
                          d={`M2,150 C48,150 52,${targetY} 98,${targetY}`}
                        />
                        <circle
                          cx="98"
                          cy={targetY}
                          r={isSelected ? 3.5 : 2}
                          fill={isSelected ? "var(--accent)" : "rgb(220 235 215 / 35%)"}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div
                className="cands"
                role="group"
                aria-label={`Meme candidates for ${pairing.stockSymbol}`}
                style={{ gridTemplateRows: `repeat(${candidates.length}, 1fr)` }}
              >
                {candidates.map((candidate, index) => (
                  <button
                    key={candidate.symbol}
                    className={`cand${selectedIndex === index ? " is-active" : ""}`}
                    type="button"
                    aria-pressed={selectedIndex === index}
                    onClick={() => selectCandidate(index)}
                  >
                    <b>{candidate.symbol}</b>
                    <span className="label">
                      {candidate.score.toFixed(1)} / {candidate.label}
                      {isTied && Math.abs(candidate.score - effectivePairing.pairScore) < 0.001 ? " · TIED" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="thesis" aria-live="polite">
              <div
                className={`pairing-thesis-content pairing-thesis-${factorPhase}`}
                key={active.symbol}
              >
                <div className="thesis-top">
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <h3>
                      {effectivePairing.stockSymbol} × {active.symbol}
                    </h3>
                    {isTied && active.symbol === effectivePairing.symbol ? (
                      <span className="label on" style={{ fontSize: "10px", padding: "2px 6px", border: "1px solid var(--accent)", color: "var(--accent)" }}>
                        TIED · {tiedCount} CANDIDATES
                      </span>
                    ) : null}
                  </div>
                  <span className="label">
                    Jev pairing{" "}
                    <b className="on">
                      {active.pairing
                        ? pairing.jevDecision.replaceAll("_", " ")
                        : "Alternative"}
                    </b>{" "}
                    / conf{" "}
                    <b>{active.pairing && pairing.confidence !== null ? `${pairing.confidence}%` : "—"}</b>
                  </span>
                </div>
                <div className="qa">
                  <span className="label">Why {pairing.stockSymbol}</span>
                  <p>{sourceCopy.thesis.whyStock}</p>
                </div>
                <div className="qa">
                  <span className="label">Why this meme</span>
                  <p>
                    {active.pairing
                      ? sourceCopy.thesis.whyMeme
                      : "Structured rationale is unavailable for this alternative."}
                  </p>
                </div>
                <div className="qa">
                  <span className="label">Why this pair</span>
                  <p>
                    {active.pairing
                      ? sourceCopy.thesis.whyPair
                      : pairing.alternatives.find(
                          (item) => item.symbol === active.symbol,
                        )?.rationale}
                  </p>
                </div>
                <div className="qa">
                  <span className="label">Why now</span>
                  <p>{sourceCopy.thesis.whyNow}</p>
                </div>
                <div className="comps">
                  {pairing.factors.slice(0, 6).map((factor, index) => {
                    const factorScore = active.pairing ? factor.score : null;
                    return (
                      <div className="comp" key={factor.id}>
                        <div className="row">
                          <span>{factor.label}</span>
                          <b className="factor-score">{factorScore === null ? "—" : factorScore}</b>
                        </div>
                        <i
                          style={
                            {
                              "--factor-scale": (factorScore ?? 0) / 100,
                              "--factor-delay": `${index * 25}ms`,
                            } as CSSProperties
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="cta-row">
                  <Link
                    className="btn btn-sm"
                    href={
                      active.pairing ? `/pairing/${pairing.slug}` : "/pairing"
                    }
                  >
                    Open pairing thesis ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineSection({
  launch,
  pairing,
  asset,
}: {
  launch: Launch;
  pairing: Pairing;
  asset: Stock;
}) {
  const canonicalStageIndex = Math.max(
    launch.stages.findIndex((stage) => stage.status === "ACTIVE"),
    0,
  );
  const [selectedStageIndex, setSelectedStageIndex] =
    useState(canonicalStageIndex);
  return (
    <section className="section" id="pipeline">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">04 / Autonomous Launch Pipeline</p>
            <h2 className="h2">
              Autonomous launch.
              <br />
              <em>Policy-bounded &amp; operator-gated.</em>
            </h2>
            <div className="pipeline-phase-badge">
              PHASE 0 · NO ON-CHAIN EXECUTION
            </div>
          </div>
          <p className="body">
            Autonomous by design, policy-bounded, operator-gated in Phase 0. A qualified pair moves through a verifiable 6-stage lifecycle and 8 mandatory policy gates before anything reaches Robinhood Chain.
          </p>
        </div>
        <ol className="stages">
          {launch.stages.map((source, index) => {
            const status = source.status;
            return (
              <li
                key={source.id}
                className={`stage ${status === "COMPLETE" ? "done" : status === "ACTIVE" ? "now" : ""}${selectedStageIndex === index ? " inspect" : ""}`}
              >
                <button
                  type="button"
                  className="stage-control"
                  aria-current={
                    selectedStageIndex === index ? "step" : undefined
                  }
                  aria-pressed={selectedStageIndex === index}
                  onClick={() => setSelectedStageIndex(index)}
                >
                  <span className="state">
                    {status === "ACTIVE"
                      ? "● Current"
                      : status === "COMPLETE"
                        ? "Done"
                        : "Pending"}
                  </span>
                  <h3>{source.id.replaceAll("_", " ")}</h3>
                  <p>{source.description}</p>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="pipe-grid">
          <div className="pipeline-timeline">
            <p className="label">
              Next agent launch /{" "}
              <b>
                {pairing.stockSymbol} × {pairing.symbol}
              </b>
            </p>
            <div className="clock">
              T-{formatCountdown(launch.countdownSeconds)}
            </div>
            <p className="label">Simulated 24h cycle / phase 0</p>
            <ol className="cycle">
              {launch.stages.map((stage, index) => (
                <li
                  key={stage.id}
                  className={`${stage.status === "COMPLETE" ? "done" : stage.status === "ACTIVE" ? "now" : ""}${selectedStageIndex === index ? " inspect" : ""}`}
                >
                  <span className="t">{stage.scheduledPoint}</span>
                  <span>{stage.description}</span>
                  <span className="s">
                    {stage.status === "COMPLETE"
                      ? "✓"
                      : stage.status === "ACTIVE"
                        ? "● Now"
                        : "Pending"}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="pipeline-policy">
            <div className="facts">
              <div className="fact">
                <span className="label">Opportunity / pairing</span>
                <span className="v">{asset.opportunityScore.toFixed(1)} / {pairing.pairScore.toFixed(1)}</span>
              </div>
              <div className="fact">
                <span className="label">Pre-launch checks</span>
                <span className="v">
                  {
                    launch.policyChecks.filter(
                      (check) => check.status === "PASSED",
                    ).length
                  }{" "}
                  / {launch.policyChecks.length} passed
                </span>
              </div>
              <div className="fact">
                <span className="label">Pairing asset</span>
                <span className="v">
                  {pairing.stockSymbol} Stock Token / canonical address required
                </span>
              </div>
              <div className="fact">
                <span className="label">Agent wallet</span>
                <span className="v">
                  {launch.wallet.label} / scoped permissions
                </span>
              </div>
              <div className="fact">
                <span className="label">Guardian approval</span>
                <span className="v">{launch.guardianRequirement.status}</span>
              </div>
              <div className="fact">
                <span className="label">Transaction</span>
                <span className="v accent">Not submitted</span>
              </div>
            </div>

            <div className="pipeline-gates-wrap">
              <span className="label">PRE-LAUNCH POLICY GATES (8 GATES) / SIMULATED AUDIT</span>
              <div className="pipeline-gates-grid">
                {launch.policyChecks.map((gate) => (
                  <div key={gate.id} className="policy-gate-card">
                    <div className="gate-top">
                      <span className="gate-label">{gate.label}</span>
                      <span className="gate-status">
                        {gate.status === "PASSED" ? "✓ Passed" : "○ Pending"}
                      </span>
                    </div>
                    <p className="gate-desc">{gate.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="perm">
              <Permission
                title="Agent can"
                items={[
                  "Deploy the approved token template",
                  "Initialise an approved pool",
                  "Call the approved launch function",
                ]}
              />
              <Permission
                title="Agent cannot"
                items={[
                  "Make arbitrary transfers",
                  "Make arbitrary contract calls",
                  "Withdraw treasury",
                  "Change ownership",
                  "Change launch parameters outside policy",
                ]}
                restricted
              />
            </div>
          </div>
        </div>
        <div className="pipeline-link">
          <Link className="btn btn-sm" href="/launch">
            Open launch pipeline →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Permission({
  title,
  items,
  restricted = false,
}: {
  title: string;
  items: string[];
  restricted?: boolean;
}) {
  return (
    <div className={restricted ? "no" : undefined}>
      <p className="label">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MemorySection({
  asset,
  memory,
  agent,
}: {
  asset: Stock;
  memory: MemoryRecord[];
  agent: AgentRuntime;
}) {
  const [, setSelectedPointIndex] = useState(
    Math.max(asset.scoreHistory.length - 1, 0),
  );

  const auditGroups = useMemo(() => {
    return groupMemoryRecords(memory);
  }, [memory]);

  const isSteadyState = useMemo(() => {
    if (asset.rankHistory.length <= 1) return true;
    const firstRank = asset.rankHistory[0]?.rank;
    const allRanksSame = asset.rankHistory.every((r) => r.rank === firstRank);
    const firstScore = asset.scoreHistory[0]?.score ?? asset.opportunityScore;
    const allScoresClose = asset.scoreHistory.every((s) => Math.abs(s.score - firstScore) < 0.2);
    return allRanksSame && allScoresClose;
  }, [asset.rankHistory, asset.scoreHistory, asset.opportunityScore]);

  const earliestTimestamp = asset.rankHistory[0]?.timestamp ?? memory[memory.length - 1]?.timestamp;
  const latestTimestamp = asset.rankHistory[asset.rankHistory.length - 1]?.timestamp ?? memory[0]?.timestamp;
  const totalDurationMinutes = useMemo(() => {
    if (!earliestTimestamp || !latestTimestamp) return 1;
    const diff = Math.abs(new Date(latestTimestamp).getTime() - new Date(earliestTimestamp).getTime());
    return Math.max(1, Math.round(diff / 60000));
  }, [earliestTimestamp, latestTimestamp]);

  const cycleCount = asset.scoreHistory.length > 0 ? asset.scoreHistory.length : memory.length;

  return (
    <section className="section" id="memory">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">05 / Agent memory</p>
            <h2 className="h2">
              The agent
              <br />
              <em>remembers state.</em>
            </h2>
          </div>
          <p className="body">
            Every cycle is stored: rank, score, the signals that changed and the
            decision Jev made. That history is what lets you audit why an asset
            rose, instead of trusting a single number.
          </p>
        </div>
        <div className="mem-grid">
          <DecisionHistoryChart
            asset={asset}
            memory={memory}
            agent={agent}
            onPointChange={setSelectedPointIndex}
          />
          <div className="mem-decisions-col" aria-label="Consolidated decisions log">
            <div className="mlog-head">
              <div className="mlog-head-left">
                <h3>Decisions Log</h3>
                <span className="label">Audit Trail</span>
              </div>
              <span className="mlog-count-badge">
                {auditGroups.length} {auditGroups.length === 1 ? "interval" : "intervals"} · {memory.length} cycles
              </span>
            </div>
            <ol className="mlog-grouped" aria-label="Observable decision events and consolidation intervals">
              {auditGroups.length === 0 ? (
                <li className="mlog-empty">No memory events recorded for {asset.symbol}.</li>
              ) : (
                auditGroups.map((group) => {
                  if (group.isChange) {
                    return (
                      <li key={group.id} className="mlog-card mlog-card--change">
                        <div className="mlog-card-top">
                          <span className="mlog-time-badge">
                            {formatClock(group.latestTimestamp).slice(0, 5)} UTC
                          </span>
                          <span className="mlog-tag mlog-tag--change">
                            ▲ STATE TRANSITION
                          </span>
                          <span className="mlog-decision on">{group.decision}</span>
                        </div>
                        <div className="mlog-card-body">
                          <div className="mlog-change-summary">
                            <b>Rank #{group.fromRank ?? "—"} → #{group.toRank ?? group.rank}</b>
                            {group.score !== null && <span>Score {group.score.toFixed(1)}</span>}
                          </div>
                          <p className="mlog-card-desc">{group.summary}</p>
                        </div>
                      </li>
                    );
                  }

                  const isGrouped = group.count > 1;
                  return (
                    <li key={group.id} className="mlog-card mlog-card--steady">
                      <div className="mlog-card-top">
                        <span className="mlog-time-badge">
                          {isGrouped
                            ? `${formatClock(group.earliestTimestamp).slice(0, 5)} – ${formatClock(group.latestTimestamp).slice(0, 5)}`
                            : `${formatClock(group.latestTimestamp).slice(0, 5)} UTC`}
                        </span>
                        <span className="mlog-tag mlog-tag--steady">
                          {isGrouped ? `UNCHANGED · ${group.count} CYCLES (${group.durationMinutes}m)` : "UNCHANGED"}
                        </span>
                        <span className="mlog-decision">{group.decision}</span>
                      </div>
                      <div className="mlog-card-body">
                        <p className="mlog-headline">
                          Unchanged for {group.durationMinutes}m, rank #{String(group.rank ?? asset.currentRank).padStart(2, "0")} @ {(group.score ?? asset.opportunityScore).toFixed(1)}
                        </p>
                        <p className="mlog-reason-sub">
                          Steady evaluation: canonical rank and score remained consistent across consecutive cycle checks.
                        </p>
                      </div>
                    </li>
                  );
                })
              )}
            </ol>
          </div>
        </div>
        <div className="transition">
          <div>
            <span className="label">Evaluation window</span>
            <span className="big">
              {totalDurationMinutes}m audit
            </span>
            <p>
              {cycleCount} continuous evaluation cycles monitored across active memory audit window.
            </p>
          </div>
          <div>
            <span className="label">Observed drift</span>
            <span className="big accent">{isSteadyState ? "0 rank drift" : "Observed transition"}</span>
            <p>
              {isSteadyState
                ? "Canonical rank and score remained steady across consecutive evaluation cycles."
                : "Observable rank or score adjustments recorded in persistent memory log."}
            </p>
          </div>
          <div>
            <span className="label">Jev decision</span>
            <span className="big accent">{asset.jevDecision}</span>
            <p>
              Confidence {asset.confidence === null ? "—" : (asset.confidence / 100).toFixed(2)}. Stored with inputs and model version.
            </p>
          </div>
          <div>
            <span className="label">Current state</span>
            <span className="big accent">#{String(asset.currentRank).padStart(2, "0")} / {asset.opportunityScore.toFixed(1)}</span>
            <p>Cycle {formatCycle(agent.activeCycle)}. Verified under canonical policy.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

type MemoryChartMode = "score" | "rank" | "decisions";
type MemoryHistoryPoint = {
  index: number;
  timestamp: string;
  score: number;
  rank: number;
};
type MemoryFieldEvent = {
  id: string;
  timestamp: string;
  label: string;
  summary: string;
};

const memoryChartModes: Array<{ id: MemoryChartMode; label: string }> = [
  { id: "score", label: "Opportunity score" },
  { id: "rank", label: "Rank history" },
  { id: "decisions", label: "Decisions" },
];

const memoryPlot = {
  left: 54,
  right: 760,
  top: 28,
  bottom: 198,
};

function clampChartValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothMemoryPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const distance = point.x - previous.x;
    return `${path} C ${previous.x + distance * 0.42} ${previous.y}, ${point.x - distance * 0.42} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function memoryEventLabel(type: string) {
  if (type === "OBSERVE") return "OBSERVE";
  if (type === "JEV_DECISION") return "JEV DECISION";
  if (type === "PAIRING") return "PAIRING";
  if (type === "ACTION") return "RANK CHANGE";
  return null;
}

function DecisionHistoryChart({
  asset,
  memory,
  agent,
  onPointChange,
}: {
  asset: Stock;
  memory: MemoryRecord[];
  agent: AgentRuntime;
  onPointChange: (index: number) => void;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<MemoryChartMode>("score");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const points = useMemo<MemoryHistoryPoint[]>(
    () =>
      asset.scoreHistory.map((entry, index) => ({
        index,
        timestamp: entry.timestamp,
        score: entry.score,
        rank: asset.rankHistory[index]?.rank ?? asset.currentRank,
      })),
    [asset],
  );

  const isSteadyState = useMemo(() => {
    if (asset.rankHistory.length <= 1) return true;
    const firstRank = asset.rankHistory[0]?.rank;
    const allRanksSame = asset.rankHistory.every((r) => r.rank === firstRank);
    const firstScore = asset.scoreHistory[0]?.score ?? asset.opportunityScore;
    const allScoresClose = asset.scoreHistory.every((s) => Math.abs(s.score - firstScore) < 0.2);
    return allRanksSame && allScoresClose;
  }, [asset.rankHistory, asset.scoreHistory, asset.opportunityScore]);

  const milestones = useMemo(() => {
    const list: Array<{ index: number; timestamp: string; rank: number; score: number; isChange: boolean }> = [];
    const len = asset.rankHistory.length;
    if (len === 0) return list;

    asset.rankHistory.forEach((entry, i) => {
      const prev = asset.rankHistory[i - 1];
      const isChange = prev !== undefined && prev.rank !== entry.rank;
      const isStart = i === 0;
      const isEnd = i === len - 1;

      if (isStart || isEnd || isChange) {
        list.push({
          index: i,
          timestamp: entry.timestamp,
          rank: entry.rank,
          score: asset.scoreHistory[i]?.score ?? asset.opportunityScore,
          isChange,
        });
      }
    });

    return list;
  }, [asset.rankHistory, asset.scoreHistory, asset.opportunityScore]);

  const earliestTimestamp = asset.rankHistory[0]?.timestamp ?? points[0]?.timestamp;
  const latestTimestamp = asset.rankHistory[asset.rankHistory.length - 1]?.timestamp ?? points[points.length - 1]?.timestamp;
  const totalDurationMinutes = useMemo(() => {
    if (!earliestTimestamp || !latestTimestamp) return 1;
    const diff = Math.abs(new Date(latestTimestamp).getTime() - new Date(earliestTimestamp).getTime());
    return Math.max(1, Math.round(diff / 60000));
  }, [earliestTimestamp, latestTimestamp]);
  const events = useMemo<MemoryFieldEvent[]>(() => {
    const traceEvents = asset.decisionTrace
      .map((event) => {
        const label = memoryEventLabel(event.type);
        return label
          ? {
              id: event.id,
              timestamp: event.timestamp,
              label,
              summary: event.summary,
            }
          : null;
      })
      .filter((event): event is MemoryFieldEvent => Boolean(event));
    const launchEvents = memory
      .filter(
        (record) =>
          (record.subject === asset.symbol ||
            record.subject.startsWith(`${asset.symbol} ×`)) &&
          record.currentState.toUpperCase().includes("LAUNCH CANDIDATE"),
      )
      .map((record) => ({
        id: record.id,
        timestamp: record.timestamp,
        label: "LAUNCH CANDIDATE",
        summary: record.summary,
      }));
    return [...traceEvents, ...launchEvents];
  }, [asset, memory]);
  const latestIndex = Math.max(points.length - 1, 0);
  const selectedIndex = lockedIndex ?? hoverIndex ?? latestIndex;
  const selectedPoint = points[selectedIndex] ?? points[latestIndex];
  const scoreValues = points.map((point) => point.score);
  const scoreMin = Math.floor(Math.min(...scoreValues, 80) - 1);
  const scoreMax = Math.ceil(Math.max(...scoreValues, 100) + 1);
  const rankMax = Math.max(...points.map((point) => point.rank), 1);
  const pointX = (index: number) => {
    if (points.length <= 1) return memoryPlot.left;
    return (
      memoryPlot.left +
      (index / (points.length - 1)) * (memoryPlot.right - memoryPlot.left)
    );
  };
  const scoreY = (score: number) =>
    memoryPlot.bottom -
    ((score - scoreMin) / Math.max(scoreMax - scoreMin, 1)) *
      (memoryPlot.bottom - memoryPlot.top);
  const rankY = (rank: number) =>
    memoryPlot.top +
    ((rank - 1) / Math.max(rankMax - 1, 1)) *
      (memoryPlot.bottom - memoryPlot.top);
  const scoreCoordinates = points.map((point) => ({
    x: pointX(point.index),
    y: scoreY(point.score),
  }));
  const rankCoordinates = points.map((point) => ({
    x: pointX(point.index),
    y: rankY(point.rank),
  }));
  const primaryCoordinates =
    mode === "rank" ? rankCoordinates : scoreCoordinates;
  const secondaryCoordinates =
    mode === "rank" ? scoreCoordinates : rankCoordinates;
  const primaryPath = smoothMemoryPath(primaryCoordinates);
  const secondaryPath = smoothMemoryPath(secondaryCoordinates);
  const selectedEvent = events.find(
    (event) => event.timestamp === selectedPoint?.timestamp,
  );
  const pointDecision =
    selectedIndex === latestIndex
      ? asset.jevDecision
      : selectedEvent?.label === "JEV DECISION"
        ? selectedEvent.label
        : "—";
  const rankChange =
    selectedIndex > 0
      ? `#${String(points[selectedIndex - 1]?.rank ?? "—").padStart(2, "0")} → #${String(selectedPoint?.rank ?? "—").padStart(2, "0")}`
      : "Initial observed state";
  const selectedCycle =
    selectedIndex === latestIndex ? formatCycle(agent.activeCycle) : "ARCHIVE";

  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setTimeout(() => setIsRevealed(true), 0);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLockedIndex(null);
      setHoverIndex(null);
      onPointChange(latestIndex);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [latestIndex, onPointChange]);

  function announcePoint(index: number | null) {
    const nextIndex = index ?? latestIndex;
    if (index === null) {
      setHoverIndex(null);
    } else {
      setHoverIndex(index);
    }
    onPointChange(nextIndex);
  }

  function inspectFromPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const bounds = svg.getBoundingClientRect();
    if (!bounds.width) return;
    const chartX = clampChartValue(
      ((event.clientX - bounds.left) / bounds.width) * 800,
      memoryPlot.left,
      memoryPlot.right,
    );
    const nearestIndex = points.reduce(
      (nearest, point, index) =>
        Math.abs(pointX(index) - chartX) < Math.abs(pointX(nearest) - chartX)
          ? index
          : nearest,
      0,
    );
    announcePoint(nearestIndex);
  }

  function lockPoint(index: number) {
    setLockedIndex(index);
    setHoverIndex(index);
    onPointChange(index);
  }

  function clearPoint() {
    setLockedIndex(null);
    announcePoint(null);
  }

  if (!selectedPoint) return null;

  return (
    <div
      ref={chartRef}
      className={`mem-chart memory-field ${isRevealed ? "is-revealed" : ""} memory-mode-${mode}`}
    >
      <div className="memory-field-toolbar">
        <div className="plane-meta">
          <span className="label">
            <b>JEV memory field</b> / {asset.symbol}
          </span>
          <span className="label">Phase 0 / simulated state</span>
        </div>
        <div
          className="memory-mode-tabs"
          role="tablist"
          aria-label="Memory visualization mode"
        >
          {memoryChartModes.map((chartMode, index) => (
            <button
              key={chartMode.id}
              type="button"
              role="tab"
              aria-selected={mode === chartMode.id}
              tabIndex={mode === chartMode.id ? 0 : -1}
              onClick={() => setMode(chartMode.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                  return;
                event.preventDefault();
                const delta = event.key === "ArrowRight" ? 1 : -1;
                const next =
                  memoryChartModes[
                    (index + delta + memoryChartModes.length) %
                      memoryChartModes.length
                  ];
                setMode(next.id);
              }}
            >
              {chartMode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="memory-plot" onClick={clearPoint}>
        <svg
          viewBox="0 0 800 240"
          role="group"
          aria-label={`${asset.symbol} JEV memory field. Opportunity score moved from ${points[0]?.score ?? "—"} to ${asset.opportunityScore}; rank moved from #${points[0]?.rank ?? "—"} to #${asset.currentRank}.`}
          onPointerMove={inspectFromPointer}
          onPointerLeave={() => {
            if (lockedIndex === null) announcePoint(null);
          }}
        >
          <g className="memory-grid">
            {[
              memoryPlot.top,
              (memoryPlot.top + memoryPlot.bottom) / 2,
              memoryPlot.bottom,
            ].map((y) => (
              <line
                key={y}
                x1={memoryPlot.left}
                y1={y}
                x2={memoryPlot.right}
                y2={y}
              />
            ))}
            {points.map((point) => (
              <line
                key={`v-${point.timestamp}`}
                x1={pointX(point.index)}
                y1={memoryPlot.top}
                x2={pointX(point.index)}
                y2={memoryPlot.bottom}
              />
            ))}
          </g>
          <g className="memory-axis-labels" aria-hidden="true">
            <text x="0" y={memoryPlot.top + 4}>
              {mode === "rank"
                ? "#01"
                : mode === "decisions"
                  ? "JEV"
                  : scoreMax.toFixed(1)}
            </text>
            <text x="0" y={memoryPlot.bottom}>
              {mode === "rank"
                ? `#${String(rankMax).padStart(2, "0")}`
                : mode === "decisions"
                  ? "STATE"
                  : scoreMin.toFixed(1)}
            </text>
          </g>
          {isSteadyState ? (
            <g className="mem-steady-watermark-group" aria-hidden="true">
              <text className="mem-steady-watermark" x={400} y={115} textAnchor="middle">
                STEADY STATE · RANK #{String(asset.currentRank).padStart(2, "0")} CONSOLIDATED OVER {points.length} CYCLES
              </text>
            </g>
          ) : null}
          <path
            className="memory-secondary-path"
            pathLength={1}
            d={secondaryPath}
          />
          <path
            className="memory-primary-path"
            pathLength={1}
            d={primaryPath}
          />
          {mode === "decisions"
            ? events.map((event, index) => {
                const start = Date.parse(
                  points[0]?.timestamp ?? event.timestamp,
                );
                const end = Date.parse(
                  points[latestIndex]?.timestamp ?? event.timestamp,
                );
                const rawProgress =
                  (Date.parse(event.timestamp) - start) /
                  Math.max(end - start, 1);
                const x =
                  memoryPlot.left +
                  clampChartValue(rawProgress, 0, 1) *
                    (memoryPlot.right - memoryPlot.left);
                const markerY = memoryPlot.top + 18 + (index % 4) * 32;
                const rightAligned = x > memoryPlot.right - 120;
                return (
                  <g className="memory-event-marker" key={event.id}>
                    <line
                      x1={x}
                      y1={markerY + 5}
                      x2={x}
                      y2={memoryPlot.bottom}
                    />
                    <circle cx={x} cy={markerY} r="3" />
                    <text
                      x={rightAligned ? x - 8 : x + 8}
                      y={markerY + 3}
                      textAnchor={rightAligned ? "end" : "start"}
                    >
                      {event.label}
                    </text>
                  </g>
                );
              })
            : null}
          <line
            className="memory-scan"
            x1={memoryPlot.left}
            y1={memoryPlot.top}
            x2={memoryPlot.left}
            y2={memoryPlot.bottom}
          />
          <g className="memory-nodes">
            {points.map((point) => {
              const y =
                mode === "rank" ? rankY(point.rank) : scoreY(point.score);
              const isSelected = point.index === selectedIndex;
              return (
                <circle
                  key={point.timestamp}
                  className={`memory-node ${isSelected ? "is-selected" : ""} ${point.index === latestIndex ? "is-current" : ""}`}
                  style={
                    {
                      "--point-delay": `${point.index * 70}ms`,
                    } as CSSProperties
                  }
                  cx={pointX(point.index)}
                  cy={y}
                  r={isSelected ? 6 : 4.5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatClock(point.timestamp)} UTC, rank #${point.rank}, opportunity score ${point.score}`}
                  onPointerEnter={() => announcePoint(point.index)}
                  onFocus={() => announcePoint(point.index)}
                  onClick={(event) => {
                    event.stopPropagation();
                    lockPoint(point.index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      lockPoint(point.index);
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>
        <div className="memory-inspector" aria-live="polite">
          <div>
            <span className="label">Cycle</span>
            <b>{selectedCycle}</b>
          </div>
          <div>
            <span className="label">UTC</span>
            <b>{formatClock(selectedPoint.timestamp)}</b>
          </div>
          <div>
            <span className="label">Rank</span>
            <b>#{String(selectedPoint.rank).padStart(2, "0")}</b>
          </div>
          <div>
            <span className="label">Opportunity</span>
            <b>{selectedPoint.score.toFixed(1)}</b>
          </div>
          <div>
            <span className="label">JEV decision</span>
            <b className={selectedIndex === latestIndex ? "on" : undefined}>
              {pointDecision}
            </b>
          </div>
          <div>
            <span className="label">State change</span>
            <b>{rankChange}</b>
          </div>
        </div>
        {selectedEvent ? (
          <p className="memory-inspector-note">{selectedEvent.summary}</p>
        ) : null}
      </div>
      <div className="mem-timeline-bar" role="region" aria-label="Consolidated cycle timeline">
        <div
          className="mem-tl-anchor mem-tl-anchor--start is-clickable"
          onClick={() => lockPoint(0)}
          role="button"
          tabIndex={0}
          title="Click to view initial audit cycle"
        >
          <span className="mem-tl-label">WINDOW START</span>
          <span className="mem-tl-time">{formatClock(points[0]?.timestamp).slice(0, 5)} UTC</span>
          <span className="mem-tl-stat">Rank #{String(points[0]?.rank ?? asset.currentRank).padStart(2, "0")} @ {(points[0]?.score ?? asset.opportunityScore).toFixed(1)}</span>
        </div>

        <div className="mem-tl-track">
          {isSteadyState ? (
            <div
              className="mem-tl-track-steady is-clickable"
              onClick={() => lockPoint(latestIndex)}
              role="button"
              tabIndex={0}
              title="Click to inspect latest state"
            >
              <div className="mem-tl-rail-line" />
              <div className="mem-tl-steady-badge">
                <span className="dot" aria-hidden="true" />
                <b>Unchanged for {totalDurationMinutes}m</b> · {points.length} cycles without drift
              </div>
              <span className="mem-tl-sub">Steady evaluation · Consecutive cycles consolidated</span>
            </div>
          ) : (
            <div className="mem-tl-track-transitions">
              <div className="mem-tl-rail-line" />
              <div className="mem-tl-milestones-row">
                {milestones.map((m, idx) => (
                  <div
                    key={m.index}
                    className={`mem-tl-node ${m.isChange ? "is-change" : ""}`}
                    onClick={() => lockPoint(m.index)}
                    role="button"
                    tabIndex={0}
                    title={`Jump to cycle at ${formatClock(m.timestamp)}`}
                  >
                    <span className="mem-tl-node-tag">
                      {m.isChange ? "▲ Shift" : idx === 0 ? "Start" : "Latest"}
                    </span>
                    <b>#{String(m.rank).padStart(2, "0")}</b>
                    <span className="mem-tl-node-time">{formatClock(m.timestamp).slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="mem-tl-anchor mem-tl-anchor--latest is-clickable"
          onClick={() => lockPoint(latestIndex)}
          role="button"
          tabIndex={0}
          title="Click to view latest active cycle"
        >
          <span className="mem-tl-label">CURRENT STATE</span>
          <span className="mem-tl-time">{formatClock(points[latestIndex]?.timestamp).slice(0, 5)} UTC</span>
          <span className="mem-tl-stat mem-tl-stat--active">
            Rank #{String(asset.currentRank).padStart(2, "0")} @ {asset.opportunityScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FinalSection({ asset }: { asset?: Stock | null }) {
  return (
    <section className="cta cta-final">
      <div className="wrap">
        <div className="cta-final-inner">
          <p className="label sec-index">06 / JEVO next</p>
          <h2>
            Enter the JEVO
            <br />
            <em>operating system.</em>
          </h2>
          <p className="body">
            Inspect current opportunities, JEV decisions, pairing theses, launch
            readiness and agent memory in one workspace.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open app →
            </Link>
            <Link className="btn" href={asset ? `/stock/${asset.symbol}` : "/app#opportunities"}>
              View current opportunity ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


