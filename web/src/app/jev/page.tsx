"use client";

import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

const SEVEN_STAGES = [
  {
    step: "01",
    title: "TELEMETRY SCAN",
    desc: "US equity and Stock Token prices, volume, news, social velocity, and narrative clusters are ingested on continuous cycles.",
    highlight: false,
  },
  {
    step: "02",
    title: "FEATURE EXTRACTION",
    desc: "Telemetry normalized into structured factor vectors: market momentum, narrative tension, and meme compatibility.",
    highlight: false,
  },
  {
    step: "03",
    title: "JEV DECISION ENGINE",
    desc: "Jev evaluates state vectors and outputs typed classifications (PROMOTE / HOLD / DEMOTE) with calibrated confidence.",
    highlight: false,
  },
  {
    step: "04",
    title: "OPPORTUNITY RANKING",
    desc: "Monitored assets ordered dynamically by thematic pairability and narrative momentum rather than raw market cap.",
    highlight: false,
  },
  {
    step: "05",
    title: "PAIRING THESIS",
    desc: "Thematic Stock × Meme combinations formulated with deterministic 6-dimension scoring and cross-market synergy.",
    highlight: false,
  },
  {
    step: "06",
    title: "HUMAN OPERATOR GATE",
    desc: "Proposals enter AGENT_PROPOSED; autonomous deployment without explicit human curation is strictly prohibited.",
    highlight: true,
    tag: "CURATION GATE",
  },
  {
    step: "07",
    title: "CONTROLLED LAUNCH",
    desc: "Curated pairings enter a simulated launch queue with 8 hard-coded pre-flight policy gates on Robinhood Chain.",
    highlight: false,
  },
];

const AGENT_CAN = [
  {
    title: "Ingest public market telemetry",
    desc: "Aggregate real-time prices, volume, social momentum, and narrative clusters across tracked assets.",
  },
  {
    title: "Output bounded classifications",
    desc: "Assign typed PROMOTE, HOLD, or DEMOTE decisions with explicit, calibrated confidence ratings.",
  },
  {
    title: "Formulate creative pairing theses",
    desc: "Synthesize thematic resonance between equity drivers and cultural meme concepts.",
  },
  {
    title: "Assemble launch parameters",
    desc: "Prepare standard token template specifications and pool boundaries for operator review.",
  },
  {
    title: "Submit curation proposals",
    desc: "Advance qualified pairings into the governance queue under strict AGENT_PROPOSED status.",
  },
];

const AGENT_CANNOT = [
  {
    title: "Execute arbitrary transfers",
    desc: "Zero authority to transfer funds, tokens, or gas outside approved deterministic contracts.",
  },
  {
    title: "Access private keys",
    desc: "The agent operates without raw wallet private keys or unconstrained on-chain signing access.",
  },
  {
    title: "Withdraw treasury assets",
    desc: "Protocol treasury and liquidity reserves remain strictly guarded under multisig governance.",
  },
  {
    title: "Bypass operator curation",
    desc: "No token deployment or liquidity initialization can execute without explicit human operator signoff.",
  },
  {
    title: "Modify policy parameters",
    desc: "Hard-coded launch limits, liquidity caps, and collision checks cannot be altered by the agent.",
  },
];

const CTA_TILES = [
  {
    title: "Open App",
    desc: "Access the autonomous intelligence workspace and live ranking.",
    href: "/app",
    external: false,
  },
  {
    title: "Decision Trace",
    desc: "Audit historical cycle logs and deterministic reasonings.",
    href: "/app#memory",
    external: true,
  },
  {
    title: "Contract Registry",
    desc: "Inspect verified testnet and mainnet contract deployments.",
    href: "/contracts",
    external: false,
  },
  {
    title: "Explore Pairings",
    desc: "Review curated and proposed stock × meme candidates.",
    href: "/pairing",
    external: false,
  },
];

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
        message="The intelligence context has not published an active cycle context for this workspace."
      />
    );
  }

  const { agent, assets } = state.data;
  const isDemoMode = state.isDemo;
  const topAsset = assets[0] ?? null;
  const recentDecisions = assets.slice(0, 5);
  const cleanCycleId =
    String(agent.activeCycle ?? "").replace(/^cycle[-_\s]*/i, "") || "—";

  return (
    <div className="landing-root jev-page-root">
      <LandingHeader currentSection="jev" />

      <main className="jev-content-frame">
        {/* Section 1: Hero (< 78svh) */}
        <section className="jev-hero" id="overview">
          <div className="jev-container jev-hero-grid">
            <div className="jev-hero-copy">
              <span className="jev-eyebrow">JEV · DECISION ENGINE</span>
              <h1 className="jev-hero-h1">Built to decide.</h1>
              <p className="jev-hero-lead">
                Unlike conversational AI models that output open-ended prose, Jev evaluates real-time market signals to return bounded classifications, factor scores, and calibrated confidence over stock × meme opportunities.
              </p>
              <div className="jev-hero-ctas">
                <Link className="btn btn-primary" href="/app">
                  Open app →
                </Link>
                <Link className="btn" href="#audit">
                  View decision trace ↗
                </Link>
              </div>
            </div>

            {/* Right: Anatomy of a decision card */}
            <div className="jev-hero-card-col">
              {topAsset ? (
                <div className="jev-anatomy-card" role="region" aria-label="Anatomy of a decision">
                  <div className="jev-anatomy-header">
                    <div className="jev-card-head-left">
                      <span className="output-status-led" />
                      <span className="jev-card-title">ANATOMY OF A DECISION</span>
                    </div>
                    <span className="jev-card-badge">
                      {isDemoMode ? "DEMO DATA · PHASE 0" : "PHASE 0 · SIMULATED DECISIONS"}
                    </span>
                  </div>

                  <div className="jev-anatomy-body">
                    {/* Field 1: Subject */}
                    <div className="jev-anatomy-row">
                      <div className="jev-field-label">
                        <span className="field-num">1</span> SUBJECT
                      </div>
                      <div className="jev-field-val jev-subject-val">
                        <b>{topAsset.symbol}</b>
                        <span className="jev-sub-name">{topAsset.name.replace(" Stock Token", "")}</span>
                      </div>
                    </div>

                    {/* Field 2: Decision */}
                    <div className="jev-anatomy-row">
                      <div className="jev-field-label">
                        <span className="field-num">2</span> DECISION
                      </div>
                      <div className="jev-field-val">
                        <span className={`decision-badge badge-${topAsset.jevDecision.toLowerCase()}`}>
                          {topAsset.jevDecision.replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Field 3: Confidence */}
                    <div className="jev-anatomy-row">
                      <div className="jev-field-label">
                        <span className="field-num">3</span> CONFIDENCE
                      </div>
                      <div className="jev-field-val jev-mono-val">
                        {topAsset.confidence !== null ? `${topAsset.confidence}%` : "—"}
                      </div>
                    </div>

                    {/* Field 4: Rank Move */}
                    <div className="jev-anatomy-row">
                      <div className="jev-field-label">
                        <span className="field-num">4</span> RANK MOVE
                      </div>
                      <div className="jev-field-val jev-mono-val">
                        {topAsset.previousRank !== null ? (
                          <>
                            #{String(topAsset.previousRank).padStart(2, "0")} → #{String(topAsset.currentRank).padStart(2, "0")}
                          </>
                        ) : (
                          <>#{String(topAsset.currentRank).padStart(2, "0")}</>
                        )}
                      </div>
                    </div>

                    {/* Available Factor Scores from Signals */}
                    <div className="jev-factors-divider" />
                    <div className="jev-factors-subgrid">
                      {topAsset.signals.slice(0, 3).map((sig) => (
                        <div key={sig.id} className="jev-factor-chip">
                          <span className="chip-name">{sig.label}</span>
                          <b className="chip-score">{sig.score.toFixed(1)}</b>
                        </div>
                      ))}
                      <div className="jev-factor-chip highlight-chip">
                        <span className="chip-name">Opportunity Score</span>
                        <b className="chip-score">{topAsset.opportunityScore.toFixed(1)}</b>
                      </div>
                    </div>
                  </div>

                  <div className="jev-anatomy-legend">
                    <span>1. Asset Identity</span>
                    <span>2. Bounded Classification</span>
                    <span>3. Calibrated Confidence</span>
                    <span>4. Rank Trajectory</span>
                  </div>
                </div>
              ) : (
                <div className="jev-anatomy-card jev-card-unavailable">
                  <div className="jev-anatomy-header">
                    <span className="jev-card-title">ANATOMY OF A DECISION</span>
                    <span className="jev-card-badge">UNAVAILABLE</span>
                  </div>
                  <div className="jev-anatomy-body">
                    <p className="jev-empty-notice">No active asset decision available this cycle.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Architectural Contrast (State -> Jev -> Decision -> Action) */}
        <section className="jev-section" id="paradigm">
          <div className="jev-container">
            <div className="jev-sec-header">
              <span className="jev-eyebrow">SYSTEM ARCHITECTURE // 01 · PARADIGM SHIFT</span>
              <h2 className="jev-sec-h2">From generative text to deterministic decision.</h2>
              <p className="jev-sec-lead">
                Jev replaces open-ended conversational models with an autonomous decision layer bounded by strict protocol policy constraints.
              </p>
            </div>

            <div className="jev-contrast-grid">
              <div className="jev-contrast-box traditional">
                <span className="jev-box-tag">TRADITIONAL LLM PARADIGM</span>
                <div className="jev-box-flow">
                  <code>INPUT</code>
                  <span className="arrow">→</span>
                  <code>REASON</code>
                  <span className="arrow">→</span>
                  <code>GENERATE TEXT</code>
                </div>
                <p className="jev-box-desc">
                  Designed for dialogue, conversational query-response, and generative prose. Operates without deterministic policy boundaries, verifiable state persistence, or automated execution gates.
                </p>
              </div>

              <div className="jev-contrast-box jev-active-box">
                <span className="jev-box-tag highlight">JEVO WITH JEV ENGINE</span>
                <div className="jev-box-flow highlight-flow">
                  <code>STATE</code>
                  <span className="arrow">→</span>
                  <code>JEV</code>
                  <span className="arrow">→</span>
                  <code>DECISION</code>
                  <span className="arrow">→</span>
                  <code>ACTION</code>
                </div>
                <p className="jev-box-desc">
                  Autonomous decision layer. Ingests normalized telemetry vectors (market momentum, social velocity, narrative signals) and outputs strongly-typed choices (PROMOTE / HOLD / DEMOTE) with explicit confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: What Jev Decides (3 Compact Cards) */}
        <section className="jev-section" id="capabilities">
          <div className="jev-container">
            <div className="jev-sec-header">
              <span className="jev-eyebrow">DECISION SPECTRUM // 02 · CORE CAPABILITIES</span>
              <h2 className="jev-sec-h2">What Jev decides.</h2>
              <p className="jev-sec-lead">
                Every scan translates raw quantitative telemetry and narrative dispersion into bounded, actionable evaluations.
              </p>
            </div>

            <div className="jev-triplet-grid">
              <div className="jev-triplet-card">
                <span className="jev-card-tag">CHOICE / PROMOTE · HOLD · DEMOTE</span>
                <h3>Bounded Classification</h3>
                <p>
                  Evaluates monitored equity tokens and assigns strict categorical states. Disqualifies assets failing minimum liquidity or momentum thresholds.
                </p>
              </div>

              <div className="jev-triplet-card">
                <span className="jev-card-tag">SCORING / 6-DIMENSION MODEL</span>
                <h3>Qualitative Factor Scoring</h3>
                <p>
                  Calculates narrative momentum, meme concept attention, cultural alignment, and crypto adjacency into an arithmetic composite score.
                </p>
              </div>

              <div className="jev-triplet-card">
                <span className="jev-card-tag">CALIBRATION / 0–100% SCALE</span>
                <h3>Calibrated Confidence</h3>
                <p>
                  Quantifies statistical certainty before advancing proposals. Prevents premature candidate promotion without high-conviction signal convergence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: 7-Stage Pipeline */}
        <section className="jev-section" id="pipeline">
          <div className="jev-container">
            <div className="jev-sec-header">
              <span className="jev-eyebrow">THE AGENT LOOP // 03 · SEVEN-STAGE PIPELINE</span>
              <h2 className="jev-sec-h2">How JEVO uses Jev in the autonomous loop.</h2>
              <p className="jev-sec-lead">
                The agent executes a continuous, event-driven surveillance and evaluation cycle across seven distinct phases.
              </p>
            </div>

            <div className="jev-stepper-grid">
              {SEVEN_STAGES.map((s) => (
                <div
                  key={s.step}
                  className={`jev-stepper-card${s.highlight ? " is-curation-gate" : ""}`}
                >
                  <div className="stepper-top">
                    <span className="stepper-num">{s.step}</span>
                    {s.tag ? <span className="stepper-gate-tag">{s.tag}</span> : null}
                  </div>
                  <h4 className="stepper-title">{s.title}</h4>
                  <p className="stepper-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Guardrails (CAN / CANNOT Matrix) */}
        <section className="jev-section" id="guardrails">
          <div className="jev-container">
            <div className="jev-sec-header">
              <span className="jev-eyebrow">POLICY BOUNDARIES // 04 · IMMUTABLE CONSTRAINTS</span>
              <h2 className="jev-sec-h2">Autonomous does not mean unrestricted.</h2>
              <div className="jev-guardrails-sub">
                <p className="jev-sec-lead">
                  Jev operates as a pure evaluation layer, strictly segregated from treasury custody and private key signing.
                </p>
                <span className="jev-notice-pill">PHASE 0 · NO ON-CHAIN EXECUTION</span>
              </div>
            </div>

            <div className="jev-matrix-grid">
              {/* Column 1: Agent CAN */}
              <div className="jev-matrix-col can-col">
                <div className="jev-col-heading">
                  <span className="matrix-icon can">✓</span>
                  <h3>AGENT CAN</h3>
                </div>
                <div className="jev-matrix-items">
                  {AGENT_CAN.map((item, idx) => (
                    <div key={idx} className="jev-matrix-item">
                      <b>{item.title}</b>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Agent CANNOT */}
              <div className="jev-matrix-col cannot-col">
                <div className="jev-col-heading">
                  <span className="matrix-icon cannot">✕</span>
                  <h3>AGENT CANNOT</h3>
                </div>
                <div className="jev-matrix-items">
                  {AGENT_CANNOT.map((item, idx) => (
                    <div key={idx} className="jev-matrix-item">
                      <b>{item.title}</b>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Latest Jev Decisions (Replaces Worker API) */}
        <section className="jev-section" id="audit">
          <div className="jev-container">
            <div className="jev-sec-header jev-audit-header">
              <div>
                <span className="jev-eyebrow">DECISION AUDIT // 05 · RECENT EVALUATION STREAM</span>
                <h2 className="jev-sec-h2">Latest Jev decisions.</h2>
              </div>
              <div className="jev-audit-meta">
                <span className="audit-meta-item">
                  ACTIVE CYCLE: <b>{cleanCycleId}</b>
                </span>
                <span className="audit-meta-item">
                  LAST DECISION: <b>{agent.lastDecisionAgeSeconds}S AGO</b>
                </span>
                <span className="audit-meta-badge">
                  {isDemoMode ? "DEMO DATA" : "PHASE 0 · SIMULATED"}
                </span>
              </div>
            </div>

            {/* Decisions Table Feed */}
            <div className="jev-audit-table">
              <div className="jev-table-head">
                <span>ASSET</span>
                <span>DECISION</span>
                <span>RANK MOVE</span>
                <span>OPPORTUNITY SCORE</span>
                <span>CONFIDENCE</span>
                <span className="text-right">AGE</span>
              </div>

              <div className="jev-table-body">
                {recentDecisions.map((asset) => {
                  const rankText =
                    asset.previousRank !== null && asset.previousRank !== asset.currentRank
                      ? `#${String(asset.previousRank).padStart(2, "0")} → #${String(asset.currentRank).padStart(2, "0")}`
                      : `#${String(asset.currentRank).padStart(2, "0")}`;

                  return (
                    <div key={asset.symbol} className="jev-table-row">
                      <div className="cell-asset">
                        <b>{asset.symbol}</b>
                        <span>{asset.name.replace(" Stock Token", "")}</span>
                      </div>

                      <div className="cell-decision">
                        <span className={`decision-badge badge-${asset.jevDecision.toLowerCase()}`}>
                          {asset.jevDecision.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="cell-rank">
                        <code>{rankText}</code>
                      </div>

                      <div className="cell-score">
                        <b>{asset.opportunityScore.toFixed(1)}</b>
                      </div>

                      <div className="cell-confidence">
                        <span>{asset.confidence !== null ? `${asset.confidence}%` : "—"}</span>
                      </div>

                      <div className="cell-age text-right">
                        <span>{agent.lastDecisionAgeSeconds}s ago</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: CTA Band (4 Tiles) */}
        <section className="jev-section jev-cta-section" id="explore">
          <div className="jev-container">
            <div className="jev-cta-quad">
              {CTA_TILES.map((tile) => (
                <Link key={tile.title} href={tile.href} className="jev-cta-tile">
                  <div className="cta-tile-head">
                    <h4>{tile.title}</h4>
                    <span className="cta-arrow">{tile.external ? "↗" : "→"}</span>
                  </div>
                  <p>{tile.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter agent={agent} />
    </div>
  );
}
