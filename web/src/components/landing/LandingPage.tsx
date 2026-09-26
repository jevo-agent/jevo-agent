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
import { formatClock, formatCountdown, formatCycle } from "@/lib/format";
import type { AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

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
  return (
    <LandingScroll>
      <div className="landing-progress" aria-hidden="true" />
      <LandingHeader />
      <main>
        <LandingHero
          agent={data.agent}
          asset={data.featuredAsset}
          pairing={data.featuredPairing}
          launch={data.launch}
        />
        <AgentSection
          agent={data.agent}
          asset={data.featuredAsset}
          pairing={data.featuredPairing}
        />
        <OpportunitySection
          assets={data.assets}
          ranking={data.ranking}
          cycle={data.agent.activeCycle}
        />
        {data.featuredPairing ? <PairingSection pairing={data.featuredPairing} asset={data.assets.find((asset) => asset.symbol === data.featuredPairing?.stockSymbol) ?? data.featuredAsset} /> : <LandingUnavailableSection id="pairings" index="03" title="No qualified pairing this cycle" copy="JEV completed the opportunity evaluation without publishing a qualified pairing candidate." />}
        {data.launch && data.featuredPairing ? <PipelineSection launch={data.launch} pairing={data.featuredPairing} asset={data.assets.find((asset) => asset.symbol === data.featuredPairing?.stockSymbol) ?? data.featuredAsset} /> : <LandingUnavailableSection id="pipeline" index="04" title="No launch candidate this cycle" copy="Launch readiness remains unavailable until a pairing candidate is approved and scheduled." />}
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

function LandingUnavailableSection({ id, index, title, copy }: { id: string; index: string; title: string; copy: string }) {
  return (
    <section className="section" id={id}>
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <p className="label sec-index">{index} / Protocol state</p>
            <h2 className="h2">{title}</h2>
          </div>
          <p className="body">{copy}</p>
        </div>
      </div>
    </section>
  );
}

function LandingHero({
  agent,
  asset,
  pairing,
  launch,
}: {
  agent: AgentRuntime;
  asset: Stock;
  pairing: Pairing | null;
  launch: Launch | null;
}) {
  return (
    <section className="hero" id="top">
      <div className="hero-frame">
        <HeroEdgeUtilities />
        <div className="hero-copy">
          <p className="label hero-plane-meta">
            <b>JEVO / Decision plane</b>
            <span>cycle {formatCycle(agent.activeCycle)}</span>
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
            <Link className="btn" href="/stock/NVDA">
              View current opportunity ↗
            </Link>
          </div>
          <p className="hero-copy-note">
            State → Jev → Decision → Action <span>Phase 0 / simulated</span>
          </p>
        </div>
        <DecisionPlane asset={asset} pairing={pairing} launch={launch} />
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
              <b>{formatCycle(agent.activeCycle)}</b> / last decision{" "}
              <b>{agent.lastDecisionAgeSeconds}s</b> ago
            </div>
          </div>
          <div className="cell">
            <div className="label">Network</div>
            <div className="label">
              <b>{agent.networkLabel ?? "UNAVAILABLE"}</b>
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
                JEVO is built to decide.
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

function PairingSection({ pairing, asset }: { pairing: Pairing; asset: Stock }) {
  const storyRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const manualTimer = useRef<number | null>(null);
  const factorTransitionTimer = useRef<number | null>(null);
  const [scrollCandidate, setScrollCandidate] = useState(0);
  const [manualCandidate, setManualCandidate] = useState<number | null>(null);
  const [displayedCandidate, setDisplayedCandidate] = useState(0);
  const [factorPhase, setFactorPhase] = useState<FactorPhase>("idle");
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
        const nextCandidate = Math.min(
          2,
          Math.floor(Math.min(progress, 0.999999) * 3),
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
  }, []);

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
              One stock. <br /> Multiple cultural expressions.
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
                  {candidates.map((candidate, index) => (
                    <path
                      key={candidate.symbol}
                      className={selectedIndex === index ? "on" : undefined}
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
                    aria-pressed={selectedIndex === index}
                    onClick={() => selectCandidate(index)}
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
              <div
                className={`pairing-thesis-content pairing-thesis-${factorPhase}`}
                key={active.symbol}
              >
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
  const [selectedPointIndex, setSelectedPointIndex] = useState(
    Math.max(asset.scoreHistory.length - 1, 0),
  );
  const selectedTimestamp = asset.scoreHistory[selectedPointIndex]?.timestamp;
  const relatedLogId = memory.find(
    (record) =>
      record.timestamp === selectedTimestamp &&
      (record.subject === asset.symbol ||
        record.subject.startsWith(`${asset.symbol} ×`)),
  )?.id;
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
          <DecisionHistoryChart
            asset={asset}
            memory={memory}
            agent={agent}
            onPointChange={setSelectedPointIndex}
          />
          <ol className="log" aria-label="Decision trace">
            {memory.slice(0, 7).map((record) => (
              <li
                key={record.id}
                className={
                  [
                    record.eventType === "JEV_DECISION" ? "k" : "",
                    record.id === relatedLogId ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
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
            <span className="big">
              {asset.previousRank === null || asset.previousScore === null
                ? "UNAVAILABLE"
                : `#${String(asset.previousRank).padStart(2, "0")} / ${asset.previousScore.toFixed(1)}`}
            </span>
            <p>
              Previous cycle state is unavailable; the worker published the current state only.
            </p>
          </div>
          <div>
            <span className="label">Observed change</span>
            <span className="big">{asset.signals.length} signals recorded</span>
            <p>
              Structured worker signal state is retained; no prior-cycle delta
              was published for this view.
            </p>
          </div>
          <div>
            <span className="label">Jev decision</span>
            <span className="big accent">{asset.jevDecision}</span>
            <p>
              Confidence {asset.confidence === null ? "unavailable" : asset.confidence / 100}. Stored with inputs and model
              version.
            </p>
          </div>
          <div>
            <span className="label">Current state</span>
            <span className="big accent">#{String(asset.currentRank).padStart(2, "0")} / {asset.opportunityScore.toFixed(1)}</span>
            <p>Cycle {formatCycle(agent.activeCycle)}. Pairing state is unavailable for this cycle.</p>
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
      <div className="snap" aria-label="Historical memory snapshots">
        {points.map((point) => (
          <button
            key={point.timestamp}
            type="button"
            aria-pressed={selectedIndex === point.index}
            onClick={() => lockPoint(point.index)}
          >
            <span className="label">
              {formatClock(point.timestamp).slice(0, 5)}
            </span>
            <b>#{String(point.rank).padStart(2, "0")}</b>
            <span className="label">{point.score.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FinalSection() {
  return (
    <section className="cta cta-final">
      <div className="wrap">
        <div className="cta-final-inner">
          <p className="label sec-index">06 / JEVO next</p>
          <h2>
            Enter the JEVO
            <br />
            operating system.
          </h2>
          <p className="body">
            Inspect current opportunities, JEV decisions, pairing theses, launch
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
            {agent.networkLabel ?? "UNAVAILABLE"} / phase 0 / simulated state
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
