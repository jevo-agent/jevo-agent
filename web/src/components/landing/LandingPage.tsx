"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { DecisionPlane } from "@/components/landing/DecisionPlane";
import { LandingScroll } from "@/components/landing/LandingScroll";
import { formatClock, formatCountdown, formatNumber } from "@/lib/format";
import type { AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface LandingPageProps {
  agent: AgentRuntime;
  assets: Stock[];
  ranking: string[];
  pairings: Pairing[];
  launch: Launch;
  memory: MemoryRecord[];
  featuredAsset: Stock;
  featuredPairing: Pairing;
}
type PairCandidate = {
  symbol: string;
  score: number;
  label: string;
  pairing?: Pairing;
};

export function LandingPage(data: LandingPageProps) {
  return (
    <LandingScroll>
      <div className="landing-progress" aria-hidden="true" />
      <LandingHeader />
      <main>
        <LandingHero
          agent={data.agent}
          asset={data.featuredAsset}
          pairing={data.featuredPairing}
        />
        <AgentSection agent={data.agent} asset={data.featuredAsset} />
        <OpportunitySection
          assets={data.assets}
          ranking={data.ranking}
          cycle={data.agent.activeCycle}
        />
        <PairingSection pairing={data.featuredPairing} />
        <PipelineSection launch={data.launch} pairing={data.featuredPairing} />
        <MemorySection
          asset={data.featuredAsset}
          memory={data.memory}
          agent={data.agent}
        />
        <FinalSection />
        <LandingFooter agent={data.agent} />
      </main>
    </LandingScroll>
  );
}

function LandingHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="JEVO home">
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            priority
            className="brand-mark"
          />
          <span className="brand-name">JEVO</span>
          <span className="brand-sub">/ Autonomous market system</span>
        </Link>
        <nav className="nav" aria-label="Sections">
          <a href="#agent">Agent</a>
          <a href="#market">Market</a>
          <a href="#pairings">Pairings</a>
          <a href="#pipeline">Architecture</a>
          <a href="#memory">Memory</a>
        </nav>
        <div className="header-actions">
          <span className="label">
            <span className="on">●</span> Jev <b>active</b>
          </span>
          <Link className="btn btn-primary btn-sm" href="/app">
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}

function LandingHero({
  agent,
  asset,
  pairing,
}: {
  agent: AgentRuntime;
  asset: Stock;
  pairing: Pairing;
}) {
  return (
    <section className="hero" id="top">
      <div className="hero-frame">
        <HeroEdgeUtilities />
        <div className="hero-copy">
          <p className="label hero-plane-meta">
            <b>JEVO / Decision plane</b>
            <span>cycle {agent.activeCycle}</span>
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
          <p className="powered">
            <span className="dot" aria-hidden="true" />
            Powered by <b>Jev</b>
          </p>
          <p className="body">
            JEVO continuously evaluates Stock Tokens, market signals, narratives
            and cultural momentum to discover which stock-native meme markets
            should exist next.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open app →
            </Link>
            <Link className="btn" href="/stock/NVDA">
              View current opportunity ↗
            </Link>
          </div>
          <p className="hero-copy-note">
            State → Jev → Decision → Action <span>Phase 0 / simulated</span>
          </p>
        </div>
        <DecisionPlane asset={asset} pairing={pairing} />
      </div>
      <div className="hero-status">
        <div className="wrap">
          <div className="cell">
            <div className="label">Jev</div>
            <div className="label">
              <b className="on">Active</b>
            </div>
          </div>
          <div className="cell">
            <div className="label">Cycle</div>
            <div className="label">
              <b>{agent.activeCycle}</b> / last decision{" "}
              <b>{agent.lastDecisionAgeSeconds}s</b> ago
            </div>
          </div>
          <div className="cell">
            <div className="label">Network</div>
            <div className="label">
              <b>{agent.networkLabel}</b>
            </div>
          </div>
          <div className="cell">
            <div className="label">State</div>
            <div className="label">
              <b>Decision loop</b>
            </div>
          </div>
          <a className="label scroll-hint" href="#agent">
            Scroll to inspect ↓
          </a>
        </div>
      </div>
    </section>
  );
}

function HeroEdgeUtilities() {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyCa() {
    try {
      let copiedWithClipboard = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText("jevoca");
          copiedWithClipboard = true;
        } catch {
          copiedWithClipboard = false;
        }
      }
      if (!copiedWithClipboard) {
        const textarea = document.createElement("textarea");
        textarea.value = "jevoca";
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        if (!document.execCommand("copy"))
          throw new Error("Clipboard unavailable");
        textarea.remove();
      }
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div
        className="hero-edge-rail hero-edge-rail-left"
        aria-label="JEVO hero system metadata"
      >
        JEVO / AGENT&nbsp;&nbsp;/&nbsp;&nbsp;JEV /
        DECISION&nbsp;&nbsp;/&nbsp;&nbsp;SYS.9841
      </div>
      <button
        className="hero-ca"
        type="button"
        onClick={copyCa}
        aria-label={
          copied
            ? "JEVO CA placeholder copied"
            : "Copy JEVO CA placeholder jevoca"
        }
      >
        <span className="hero-ca-prefix">CA</span>
        <code>jevoca</code>
        <span aria-hidden="true">↗</span>
        <span className="hero-ca-copy">[{copied ? "COPIED" : "COPY"}]</span>
      </button>
      <span className="hero-ca-feedback" aria-live="polite">
        {copied ? "CA placeholder copied" : ""}
      </span>
      <div className="hero-edge-rail hero-edge-rail-right" aria-hidden="true">
        <span>AUTONOMOUS // JEV // AGENT</span>
        <span>INTERFACE: ONLINE</span>
      </div>
    </>
  );
}

function AgentSection({ agent, asset }: { agent: AgentRuntime; asset: Stock }) {
  const rows = [
    {
      title: "Observe market signals",
      copy: "Stock Token prices, volume, news, social velocity and narrative clusters are ingested on scheduled and event-driven scans.",
      status: "Delta scan / 60s",
    },
    {
      title: "Jev evaluates state",
      copy: "Bounded decisions per asset: promote, hold or demote, with a confidence and the signals that moved it.",
      status: `${formatNumber(agent.decisionsProcessed)} decisions`,
    },
    {
      title: "Rank opportunities",
      copy: "Signals combine into an opportunity score. It measures pairability, not expected returns.",
      status: "Ranking / 5 min",
    },
    {
      title: "Advance qualified pairs",
      copy: "Top assets get stock × meme pairing theses. Qualified pairs move into a policy-checked launch cycle.",
      status: "1 launch candidate",
    },
  ];
  return (
    <section className="section" id="agent">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">01 / The agent</p>
            <h2 className="h2">
              Most AI is built to talk.
              <br />
              JEVO is built to decide.
            </h2>
          </div>
          <p className="body">
            Jev is the decision layer. Instead of generating text, it returns
            structured choices, scores and classifications. JEVO runs those
            decisions in a continuous loop over the market, and records every
            one.
          </p>
        </div>
        <div className="agent-grid">
          <div className="contrast" aria-label="Traditional LLM versus JEVO">
            <div className="contrast-row">
              <span className="label">Typical LLM</span>
              <span className="chainline">INPUT → REASON → GENERATE TEXT</span>
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
                PROMOTE {asset.symbol} / #04 → #01 / CONF{" "}
                {asset.confidence / 100}
              </span>
            </div>
          </div>
          <div className="caps">
            {rows.map((row, index) => (
              <div className="cap" key={row.title}>
                <span className="n">[0{index + 1}]</span>
                <div>
                  <h3>{row.title}</h3>
                  <p>{row.copy}</p>
                </div>
                <span className="st">{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OpportunitySection({
  assets,
  ranking,
  cycle,
}: {
  assets: Stock[];
  ranking: string[];
  cycle: number;
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
            : left.previousRank - right.previousRank,
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
              Built to find what
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
              Previous / {cycle - 1}
            </button>
            <button
              type="button"
              aria-pressed={view === "curr"}
              onClick={() => setView("curr")}
            >
              Current / {cycle}
            </button>
          </div>
          <span className="label">
            Last ranking <b>{cycle}</b> / demo fixture
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
          <ol className="rank-list">
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
                  >
                    <span className="pos">{String(rank).padStart(2, "0")}</span>
                    <span className="asset">
                      <b>{asset.symbol}</b>
                      <span>{asset.name.replace(" Stock Token", "")}</span>
                    </span>
                    <span className="bar">
                      <span>{score.toFixed(1)}</span>
                      <i style={{ "--w": `${score}%` } as CSSProperties} />
                    </span>
                    <span
                      className={`delta ${asset.rankMovement > 0 ? "up" : asset.rankMovement < 0 ? "dn" : "flat"}`}
                    >
                      {view === "curr"
                        ? asset.rankMovement > 0
                          ? `▲ +${asset.rankMovement}`
                          : asset.rankMovement < 0
                            ? `▼ ${Math.abs(asset.rankMovement)}`
                            : "—"
                        : "—"}
                    </span>
                    <span
                      className={`dec ${asset.jevDecision === "PROMOTE" ? "promote" : asset.rankMovement < 0 ? "demote" : ""}`}
                    >
                      {view === "curr"
                        ? asset.jevDecision
                        : `Cycle ${cycle - 1}`}
                    </span>
                    <span className="age">
                      {view === "curr"
                        ? `${formatClock(asset.lastEvaluatedAt)} UTC`
                        : "previous"}
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

function PairingSection({ pairing }: { pairing: Pairing }) {
  const [selected, setSelected] = useState(0);
  const candidates: PairCandidate[] = [
    {
      symbol: pairing.symbol,
      score: pairing.pairScore,
      label: "strong pair",
      pairing,
    },
    ...pairing.alternatives.map((alternative) => ({
      symbol: alternative.symbol,
      score: alternative.pairScore,
      label: "alternative",
    })),
  ];
  const active = candidates[selected] ?? candidates[0];
  const sourceCopy = active.pairing ?? pairing;
  return (
    <section className="section" id="pairings">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">03 / Stock × meme pairing</p>
            <h2 className="h2 text-4xl!">
              One stock. <br /> Multiple cultural expressions.
            </h2>
          </div>
          <p className="body">
            Rank alone never picks the meme. Each candidate gets its own thesis:
            why this stock, why this meme, why together, why now. Select a
            candidate to compare.
          </p>
        </div>
        <div className="pair-grid">
          <div className="pair-map">
            <div className="pair-src">
              <span className="label">Stock Token</span>
              <b>{pairing.stockSymbol}</b>
              <span className="label">
                Rank <b>#01</b> / 96.8
              </span>
            </div>
            <div className="pair-links" aria-hidden="true">
              <svg viewBox="0 0 100 300" preserveAspectRatio="none">
                {candidates.map((candidate, index) => (
                  <path
                    key={candidate.symbol}
                    className={selected === index ? "on" : undefined}
                    d={`M0,150 C50,150 50,${50 + index * 100} 100,${50 + index * 100}`}
                  />
                ))}
              </svg>
            </div>
            <div
              className="cands"
              role="group"
              aria-label={`Meme candidates for ${pairing.stockSymbol}`}
            >
              {candidates.map((candidate, index) => (
                <button
                  key={candidate.symbol}
                  className="cand"
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <b>{candidate.symbol}</b>
                  <span className="label">
                    {candidate.score} / {candidate.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="thesis" aria-live="polite">
            <div className="thesis-top">
              <h3>
                {pairing.stockSymbol} × {active.symbol}
              </h3>
              <span className="label">
                Jev pairing{" "}
                <b className="on">
                  {active.pairing
                    ? pairing.jevDecision.replaceAll("_", " ")
                    : "Alternative"}
                </b>{" "}
                / conf <b>{active.pairing ? `${pairing.confidence}%` : "—"}</b>
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
                  : `The ${active.symbol} concept retains a coherent link to ${pairing.stockSymbol}'s market narrative.`}
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
              {pairing.factors.slice(0, 6).map((factor) => (
                <div className="comp" key={factor.id}>
                  <div className="row">
                    <span>{factor.label}</span>
                    <b>
                      {active.pairing
                        ? factor.score
                        : Math.max(70, factor.score - 7)}
                    </b>
                  </div>
                  <i
                    style={
                      {
                        "--w": `${active.pairing ? factor.score : Math.max(70, factor.score - 7)}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
            <div className="cta-row">
              <Link
                className="btn btn-sm"
                href={active.pairing ? `/pairing/${pairing.slug}` : "/pairing"}
              >
                Open pairing thesis ↗
              </Link>
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
}: {
  launch: Launch;
  pairing: Pairing;
}) {
  const stages = ["Observe", "Evaluate", "Rank", "Pair", "Validate", "Launch"];
  return (
    <section className="section" id="pipeline">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">04 / Autonomous pipeline</p>
            <h2 className="h2">
              From signal
              <br />
              to controlled launch.
            </h2>
          </div>
          <p className="body">
            Autonomous does not mean unrestricted. The agent can only call
            pre-approved actions through a policy contract, and Phase 0 keeps
            the transaction state explicitly not submitted.
          </p>
        </div>
        <ol className="stages">
          {stages.map((stage, index) => {
            const source = launch.stages[index];
            const status = source?.status ?? "PENDING";
            return (
              <li
                key={stage}
                className={`stage ${status === "COMPLETE" ? "done" : status === "ACTIVE" ? "now" : ""}`}
              >
                <span className="state">
                  {status === "ACTIVE"
                    ? "● Current"
                    : status === "COMPLETE"
                      ? "Done"
                      : "Pending"}
                </span>
                <h3>{stage}</h3>
                <p>{source?.description ?? "Controlled protocol stage"}</p>
              </li>
            );
          })}
        </ol>
        <div className="pipe-grid">
          <div>
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
              {launch.stages.map((stage) => (
                <li
                  key={stage.id}
                  className={
                    stage.status === "COMPLETE"
                      ? "done"
                      : stage.status === "ACTIVE"
                        ? "now"
                        : ""
                  }
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
          <div>
            <div className="facts">
              <div className="fact">
                <span className="label">Opportunity / pairing</span>
                <span className="v">96.8 / {pairing.pairScore}</span>
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
                  "Withdraw treasury",
                  "Change launch parameters",
                ]}
                restricted
              />
            </div>
          </div>
        </div>
        <div className="pipeline-link">
          <Link className="btn btn-sm" href="/launch">
            Open launch workspace →
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
  const rankPoints = asset.rankHistory
    .map(
      (entry, index) =>
        `${40 + index * 180},${180 - Math.max(0, 10 - entry.rank) * 20}`,
    )
    .join(" ");
  const scorePoints = asset.scoreHistory
    .map(
      (entry, index) => `${40 + index * 180},${168 - (entry.score - 80) * 3.2}`,
    )
    .join(" ");
  return (
    <section className="section" id="memory">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">05 / Agent memory</p>
            <h2 className="h2">
              The agent
              <br />
              remembers state.
            </h2>
          </div>
          <p className="body">
            Every cycle is stored: rank, score, the signals that changed and the
            decision Jev made. That history is what lets you audit why an asset
            rose, instead of trusting a single number.
          </p>
        </div>
        <div className="mem-grid">
          <div>
            <div className="mem-chart">
              <div className="plane-meta">
                <span className="label">
                  <b>{asset.symbol}</b> / rank <span className="on">—</span>{" "}
                  &nbsp;score <span className="score-muted">- - -</span>
                </span>
                <span className="label">Today / UTC</span>
              </div>
              <svg
                viewBox="0 0 800 220"
                role="img"
                aria-label={`${asset.symbol} rank rose from ${asset.rankHistory[0]?.rank ?? "—"} to ${asset.currentRank} and score from ${asset.scoreHistory[0]?.score ?? "—"} to ${asset.opportunityScore}`}
              >
                <line className="mem-axis" x1="0" y1="200" x2="800" y2="200" />
                <line
                  className="mem-axis"
                  x1="0"
                  y1="20"
                  x2="800"
                  y2="20"
                  strokeDasharray="2 5"
                />
                <text className="tick small" x="0" y="14">
                  #01
                </text>
                <polyline className="mem-score" points={scorePoints} />
                <polyline className="mem-rank" points={rankPoints} />
                {asset.rankHistory.map((entry, index) => (
                  <circle
                    key={entry.timestamp}
                    className="mem-pt"
                    cx={40 + index * 180}
                    cy={180 - Math.max(0, 10 - entry.rank) * 20}
                    r={index === asset.rankHistory.length - 1 ? 6 : 5}
                  />
                ))}
              </svg>
            </div>
            <div className="snap">
              {asset.rankHistory.map((entry, index) => (
                <div key={entry.timestamp}>
                  <span className="label">
                    {formatClock(entry.timestamp).slice(0, 5)}
                  </span>
                  <b>#{String(entry.rank).padStart(2, "0")}</b>
                  <span className="label">
                    {asset.scoreHistory[index]?.score ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ol className="log" aria-label="Decision trace">
            {memory.slice(0, 7).map((record) => (
              <li
                key={record.id}
                className={
                  record.eventType === "JEV_DECISION" ? "k" : undefined
                }
              >
                <span className="t">{formatClock(record.timestamp)}</span>
                <span>{record.summary}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="transition">
          <div>
            <span className="label">Previous state</span>
            <span className="big">#04 / {asset.previousScore}</span>
            <p>
              Cycle {agent.activeCycle - 1}, ranked behind AMD, PLTR and TSLA.
            </p>
          </div>
          <div>
            <span className="label">Observed change</span>
            <span className="big">+3 signals</span>
            <p>
              AI infrastructure narrative accelerated, social velocity rose, and
              overlap was detected.
            </p>
          </div>
          <div>
            <span className="label">Jev decision</span>
            <span className="big accent">{asset.jevDecision}</span>
            <p>
              Confidence {asset.confidence / 100}. Stored with inputs and model
              version.
            </p>
          </div>
          <div>
            <span className="label">Current state</span>
            <span className="big accent">#01 / {asset.opportunityScore}</span>
            <p>Cycle {agent.activeCycle}. Pairing review opened for $GPU.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalSection() {
  return (
    <section className="cta">
      <div className="wrap">
        <div>
          <p className="label sec-index">06 / JEVO next</p>
          <h2>
            Enter the
            <br />
            JEVO operating
            <br />
            system.
          </h2>
        </div>
        <div className="right">
          <p className="body">
            Inspect current opportunities, Jev decisions, pairing theses, launch
            readiness and agent memory in one workspace.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open app →
            </Link>
            <Link className="btn" href="/stock/NVDA">
              View current opportunity ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter({ agent }: { agent: AgentRuntime }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <Link className="brand" href="/">
            <Image
              src="/logo.png"
              alt=""
              width={22}
              height={22}
              className="brand-mark"
            />
            <span className="brand-name">JEVO</span>
            <span className="hidden brand-sub">/ Powered by Jev</span>
          </Link>
          <p className="label footer-phase">
            {agent.networkLabel} / phase 0 / simulated state
          </p>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <Link href="/app">App</Link>
          <Link href="/pairing">Pairings</Link>
          <Link href="/memory">Memory</Link>
          <a href="#pipeline">Architecture</a>
        </nav>
        <div className="foot-note">
          <span className="label">
            JEVO is an independent protocol and is not affiliated with,
            sponsored by, or endorsed by Robinhood.
          </span>
          <span className="label">Not financial advice</span>
        </div>
      </div>
    </footer>
  );
}
