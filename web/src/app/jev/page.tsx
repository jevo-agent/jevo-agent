"use client";

import Link from "next/link";
import Image from "next/image";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";
import { formatCycle } from "@/lib/format";

export default function JevAboutPage() {
  const state = useProtocolState();

  if (state.isLoading) return <QueryLoadingState title="Loading Jev Intelligence" />;
  if (state.isError) {
    return (
      <QueryErrorState
        title="Failed to Load Jev Intelligence"
        error={state.error}
        onRetry={() => void state.refetch()}
      />
    );
  }
  if (!state.data) {
    return (
      <QueryEmptyState
        title="No canonical Jev state"
        message="The worker has not published an active cycle context for this workspace."
      />
    );
  }

  const { agent, assets } = state.data;
  const isDemoMode = state.isDemo;
  const recentDecisions = assets.slice(0, 5);

  return (
    <div className="landing-root jev-about-page">
      {/* Public Navigation Header */}
      <header className="header" role="banner">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="JEVO home">
            <Image
              src="/icon.png"
              alt="JEVO"
              width={28}
              height={28}
              priority
              className="brand-mark"
            />
            <span className="brand-name">JEVO</span>
            <span className="brand-sub">/ Autonomous market system</span>
          </Link>
          <nav className="nav" aria-label="Sections">
            <Link href="/jev" className="is-active">JEV</Link>
            <Link href="/#agent">Agent</Link>
            <Link href="/#market">Market</Link>
            <Link href="/#pairings">Pairings</Link>
            <Link href="/#pipeline">Architecture</Link>
            <Link href="/#memory">Memory</Link>
            <Link href="/contracts">CONTRACTS</Link>
          </nav>
          <div className="head-r">
            <span className="live-pill" aria-label="System status">
              <span className="on">●</span> Jev <b>active</b>
            </span>
            <Link className="btn btn-primary btn-sm" href="/app">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <main className="jev-main-content">
        {/* Hero Section */}
        <section className="section jev-hero-section">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <p className="label sec-index">ARCHITECTURE // 01 · DECISION ENGINE</p>
                <h1 className="h1">
                  Most AI is built to talk.
                  <br />
                  Jev is built to <em>decide.</em>
                </h1>
              </div>
              <div className="jev-hero-meta">
                <div className="jev-badge-pill">
                  {isDemoMode ? "DEMO DATA · PHASE 0" : "PHASE 0 · SIMULATED DECISIONS"}
                </div>
                <p className="body">
                  Jev is the dedicated decision engine that powers the JEVO protocol. Unlike conversational
                  large language models that output open-ended prose, Jev evaluates structured market telemetry
                  and returns bounded, typed classifications, qualitative factor scores, and calibrated confidence
                  metrics over opportunities prepared by the protocol.
                </p>
              </div>
            </div>

            {/* Architectural Contrast Matrix */}
            <div className="contrast-grid">
              <div className="contrast-card traditional">
                <span className="label">TRADITIONAL LLM PARADIGM</span>
                <div className="contrast-flow">
                  <code>INPUT</code>
                  <span className="arrow">→</span>
                  <code>REASON</code>
                  <span className="arrow">→</span>
                  <code>GENERATE TEXT</code>
                </div>
                <p className="contrast-desc">
                  Designed for dialogue, conversational query-response, and generative prose.
                  Lacks deterministic policy boundaries and verifiable state persistence.
                </p>
              </div>

              <div className="contrast-card jev-card">
                <span className="label highlight">JEVO WITH JEV ENGINE</span>
                <div className="contrast-flow highlight-flow">
                  <code>STATE</code>
                  <span className="arrow">→</span>
                  <code>JEV</code>
                  <span className="arrow">→</span>
                  <code>DECISION</code>
                  <span className="arrow">→</span>
                  <code>ACTION</code>
                </div>
                <p className="contrast-desc">
                  Autonomous decision layer. Ingests normalized telemetry vectors and outputs
                  strongly-typed choices (PROMOTE / HOLD / DEMOTE) with explicit confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How JEVO Uses Jev Section */}
        <section className="section jev-pipeline-flow-section">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <p className="label sec-index">THE AGENT LOOP // 02 · SEVEN-STAGE PIPELINE</p>
                <h2 className="h2">
                  How JEVO uses Jev
                  <br />
                  in the <em>autonomous loop.</em>
                </h2>
              </div>
              <p className="body">
                The agent executes a continuous, event-driven surveillance and evaluation cycle.
                Every decision passes through multiple verifiable gates before advancing to candidate pairing.
              </p>
            </div>

            <div className="jev-stages-grid">
              <div className="jev-stage-card">
                <span className="step-num">01</span>
                <h3>TELEMETRY SCAN</h3>
                <p>US equity and Stock Token prices, volume, liquidity, news, and social velocity ingested continuously.</p>
              </div>
              <div className="jev-stage-card">
                <span className="step-num">02</span>
                <h3>FEATURE EXTRACTION</h3>
                <p>Telemetry normalized into structured factors: momentum, narrative tension, and meme compatibility.</p>
              </div>
              <div className="jev-stage-card">
                <span className="step-num">03</span>
                <h3>JEV DECISION ENGINE</h3>
                <p>Jev evaluates state vectors and returns typed classifications (PROMOTE / HOLD / DEMOTE) with confidence scores.</p>
              </div>
              <div className="jev-stage-card">
                <span className="step-num">04</span>
                <h3>OPPORTUNITY RANKING</h3>
                <p>Assets ranked dynamically by pairability and cultural alignment rather than speculative yield.</p>
              </div>
              <div className="jev-stage-card">
                <span className="step-num">05</span>
                <h3>PAIRING THESIS</h3>
                <p>Thematic Stock × Meme pairings synthesized with independent mathematical scoring and creative thesis.</p>
              </div>
              <div className="jev-stage-card">
                <span className="step-num">06</span>
                <h3>HUMAN OPERATOR GATE</h3>
                <p>Proposals held in AGENT_PROPOSED state. No launch or execution occurs without explicit operator authorization.</p>
              </div>
              <div className="jev-stage-card highlight-stage">
                <span className="step-num">07</span>
                <h3>CONTROLLED LAUNCH</h3>
                <p>Approved pairings enter a 6-stage simulated countdown with 8 hard-coded pre-flight policy gates.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety & Constraints Matrix (CAN vs CANNOT) */}
        <section className="section jev-safety-section">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <p className="label sec-index">SECURITY & BOUNDARIES // 03 · POLICY BOUNDS</p>
                <h2 className="h2">
                  Autonomous does not mean
                  <br />
                  <em>unrestricted.</em>
                </h2>
              </div>
              <p className="body">
                The agent is constrained by immutable policy contracts and strict role boundaries.
                Jev functions as an evaluation layer, not an autonomous treasury custodian.
              </p>
            </div>

            <div className="safety-matrix-grid">
              <div className="safety-column can-column">
                <div className="safety-col-head">
                  <span className="dot on">●</span>
                  <h3>AGENT CAN</h3>
                </div>
                <ul className="safety-list">
                  <li>
                    <b>Ingest public market telemetry:</b> Aggregate real-time prices, volume, social momentum, and narrative clusters.
                  </li>
                  <li>
                    <b>Output bounded classifications:</b> Assign typed PROMOTE, HOLD, or DEMOTE decisions with explicit confidence ratings.
                  </li>
                  <li>
                    <b>Formulate creative pairing theses:</b> Synthesize thematic connections between equity drivers and cultural meme concepts.
                  </li>
                  <li>
                    <b>Assemble launch parameters:</b> Prepare standard token template parameters and pool specifications for operator review.
                  </li>
                  <li>
                    <b>Submit curation proposals:</b> Advance qualified pairings into the governance queue under AGENT_PROPOSED status.
                  </li>
                </ul>
              </div>

              <div className="safety-column cannot-column">
                <div className="safety-col-head">
                  <span className="dot off">✕</span>
                  <h3>AGENT CANNOT</h3>
                </div>
                <ul className="safety-list">
                  <li>
                    <b>Execute arbitrary transfers:</b> Zero authority to transfer funds, tokens, or gas outside approved contracts.
                  </li>
                  <li>
                    <b>Access private keys:</b> The agent operates without raw wallet private keys or unconstrained signing access.
                  </li>
                  <li>
                    <b>Withdraw treasury assets:</b> Protocol treasury and liquidity reserves remain strictly multisig-guarded.
                  </li>
                  <li>
                    <b>Bypass operator curation:</b> No token deployment or liquidity initialization can execute without operator signoff.
                  </li>
                  <li>
                    <b>Modify policy parameters:</b> Hard-coded launch limits, liquidity caps, and collision checks cannot be altered by the agent.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Real Live Decisions from API */}
        <section className="section jev-decisions-section">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <p className="label sec-index">LIVE AUDIT // 04 · RECENT JEV DECISIONS</p>
                <h2 className="h2">
                  Latest decisions
                  <br />
                  from the <em>worker API.</em>
                </h2>
              </div>
              <div className="jev-decision-meta">
                <span className="label">
                  ACTIVE CYCLE: <b>{formatCycle(agent.activeCycle)}</b>
                </span>
                <span className="label">
                  LAST DECISION: <b>{agent.lastDecisionAgeSeconds}S AGO</b>
                </span>
                <span className="label highlight">
                  {isDemoMode ? "DEMO DATA" : "PHASE 0 · SIMULATED"}
                </span>
              </div>
            </div>

            <div className="jev-decisions-feed">
              {recentDecisions.map((asset) => {
                const decisionClass =
                  asset.jevDecision === "PROMOTE"
                    ? "decision-promote"
                    : asset.jevDecision === "HOLD"
                      ? "decision-hold"
                      : "decision-demote";
                const rankText =
                  asset.previousRank !== null
                    ? `#${String(asset.previousRank).padStart(2, "0")} → #${String(asset.currentRank).padStart(2, "0")}`
                    : `#${String(asset.currentRank).padStart(2, "0")}`;

                return (
                  <div key={asset.symbol} className="jev-decision-row">
                    <div className="row-left">
                      <span className="asset-sym">{asset.symbol}</span>
                      <span className={`decision-badge ${decisionClass}`}>
                        {asset.jevDecision.replaceAll("_", " ")}
                      </span>
                      <span className="rank-change">{rankText}</span>
                    </div>

                    <div className="row-center">
                      <p className="thesis-snippet" title={asset.decisionTrace[0]?.summary ?? `${asset.symbol} evaluated in cycle`}>
                        {asset.decisionTrace[0]?.summary ?? `${asset.name} evaluated in cycle with ${asset.jevDecision.toLowerCase()} conviction.`}
                      </p>
                    </div>

                    <div className="row-right">
                      <div className="metric">
                        <span className="label">SCORE</span>
                        <span className="val">{asset.opportunityScore.toFixed(1)}</span>
                      </div>
                      <div className="metric">
                        <span className="label">CONFIDENCE</span>
                        <span className="val">{asset.confidence === null ? "—" : `${asset.confidence}%`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="jev-cta-row">
              <Link className="btn btn-primary" href="/app">
                Enter Protocol App →
              </Link>
              <Link className="btn" href="/app">
                View Decision Trace ↗
              </Link>
              <Link className="btn" href="/contracts">
                View Contract Registry ↗
              </Link>
              <Link className="btn" href="/pairing">
                Explore Pairings ↗
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="footer" role="contentinfo">
        <div className="wrap">
          <div className="foot-brand">
            <Link className="brand" href="/" aria-label="JEVO home">
              <Image src="/icon.png" alt="JEVO" width={24} height={24} />
              <span className="brand-name">JEVO</span>
            </Link>
            <p className="label footer-phase">
              {agent.networkLabel ?? "UNAVAILABLE"} / phase 0 / simulated state
            </p>
          </div>
          <nav className="foot-links" aria-label="Footer">
            <Link href="/jev">Jev</Link>
            <Link href="/app">App</Link>
            <Link href="/pairing">Pairings</Link>
            <Link href="/memory">Memory</Link>
            <Link href="/contracts">Contracts</Link>
            <Link href="/#pipeline">Architecture</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
