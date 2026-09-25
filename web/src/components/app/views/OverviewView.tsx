"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";

import { formatClock, formatCountdown, formatNumber } from "@/lib/format";
import type { AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface OverviewViewProps { agent: AgentRuntime; assets: Stock[]; ranking: string[]; pairings: Pairing[]; launch: Launch; memory: MemoryRecord[]; featuredPairing: Pairing; }
type MainTab = "rank" | "map" | "trace";
type SideTab = "pairing" | "launch";
type DecisionFilter = "all" | "PROMOTE" | "DEMOTE";

export function OverviewView({ agent, assets, ranking, pairings, launch, memory, featuredPairing }: OverviewViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>("rank");
  const [sideTab, setSideTab] = useState<SideTab>("pairing");
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<DecisionFilter>("all");
  const [sort, setSortValue] = useState<"rank" | "score" | "delta">("rank");
  const [direction, setDirection] = useState<1 | -1>(1);
  const ordered = useMemo(() => ranking.map((symbol) => assets.find((asset) => asset.symbol === symbol)).filter((asset): asset is Stock => Boolean(asset)), [assets, ranking]);
  const rows = useMemo(() => ordered.filter((asset) => {
    const matchesQuery = !query || `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.toLowerCase());
    const matchesDecision = decision === "all" || (decision === "PROMOTE" ? asset.jevDecision === "PROMOTE" : asset.rankMovement < 0);
    return matchesQuery && matchesDecision;
  }).sort((left, right) => {
    const leftValue = sort === "rank" ? left.currentRank : sort === "score" ? left.opportunityScore : left.rankMovement;
    const rightValue = sort === "rank" ? right.currentRank : sort === "score" ? right.opportunityScore : right.rankMovement;
    return (leftValue - rightValue) * direction;
  }), [decision, direction, ordered, query, sort]);
  const passedChecks = launch.policyChecks.filter((check) => check.status === "PASSED").length;

  return <>
    <section className="app-hero"><p className="eyebrow label"><span className="on">●</span> Robinhood Chain · Autonomous market agent</p><h1>Opportunity ranking,<br /><span className="hl">pairing &amp; launch</span> — one agent.</h1><p>Jev continuously scans US Stock Tokens, evaluates narrative and cultural signals, and advances the strongest stock-to-meme pairs toward a policy-controlled launch on Robinhood Chain.</p><div className="hero-btns"><Link className="hbtn primary" href="/stock/NVDA">View top opportunity →</Link><Link className="hbtn" href="/pairing">+ Inspect pairing</Link><a className="hbtn ghost" href="#rankPanel">Explore ranking ↓</a></div></section>
    <section className="stats4" aria-label="JEVO overview statistics"><div className="s"><span className="label">Opportunities tracked</span><div className="v">{formatNumber(agent.qualifiedCandidates)}</div><span className="label">Candidates this cycle</span></div><div className="s"><span className="label">Jev decisions</span><div className="v on">{formatNumber(agent.decisionsProcessed)}</div><span className="label">Cycle {agent.activeCycle}</span></div><div className="s"><span className="label">Network</span><div className="v muted">{agent.networkLabel}</div><span className="label">Mainnet · Chain ID 4663</span></div><div className="s"><span className="label">Data state</span><div className="v muted">Simulated</div><span className="label">Phase 0</span></div></section>
    <section className="ticker" aria-label="Live agent feed"><span className="lbl"><span className="live-dot" /> Live agent feed</span><span className="chip up">NVDA <b>Promote #04→#01</b></span><span className="chip up">TSLA <b>+1</b></span><span className="chip dn">{agent.latestEvents[0]?.subject ?? "AMD"} <b>Observed</b></span><span className="chip up">{featuredPairing.stockSymbol} × {featuredPairing.symbol} <b>Strong pair</b></span><span className="chip">Robinhood Chain · Cycle {agent.activeCycle}</span></section>
    <section className="split" id="rankPanel"><div className="panel"><div className="tabs" role="tablist" aria-label="Overview data views"><button role="tab" aria-selected={mainTab === "rank"} onClick={() => setMainTab("rank")}>Opportunity rank</button><button role="tab" aria-selected={mainTab === "map"} onClick={() => setMainTab("map")}>Market map</button><button role="tab" aria-selected={mainTab === "trace"} onClick={() => setMainTab("trace")}>Decision trace</button></div>{mainTab === "rank" ? <RankPanel rows={rows} query={query} onQuery={setQuery} decision={decision} onDecision={setDecision} sort={sort} onSort={setSortValue} direction={direction} onDirection={setDirection} /> : mainTab === "map" ? <MarketMap assets={ordered} /> : <DecisionTrace agent={agent} memory={memory} />}</div><div className="panel side-tabs"><div className="tabs" role="tablist" aria-label="Next actions"><button role="tab" aria-selected={sideTab === "pairing"} onClick={() => setSideTab("pairing")}>Pairing</button><button role="tab" aria-selected={sideTab === "launch"} onClick={() => setSideTab("launch")}>Launch</button></div>{sideTab === "pairing" ? <PairingAction pairing={featuredPairing} /> : <LaunchAction launch={launch} pairing={featuredPairing} passedChecks={passedChecks} />}</div></section>
    <ExploreRow pairings={pairings} memory={memory} />
  </>;
}

function RankPanel({ rows, query, onQuery, decision, onDecision, sort, onSort, direction, onDirection }: { rows: Stock[]; query: string; onQuery: (value: string) => void; decision: DecisionFilter; onDecision: (value: DecisionFilter) => void; sort: "rank" | "score" | "delta"; onSort: (value: "rank" | "score" | "delta") => void; direction: 1 | -1; onDirection: (value: 1 | -1) => void }) {
  const router = useRouter();
  const selectSort = (value: "rank" | "score" | "delta") => { if (sort === value) onDirection(direction === 1 ? -1 : 1); else { onSort(value); onDirection(value === "rank" ? 1 : -1); } };
  return <div className="tabpanel active" role="tabpanel"><div className="tools-row"><label className="tsearch"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} type="search" placeholder="Filter…" aria-label="Filter opportunities" /></label><div className="seg" role="group" aria-label="Decision filter"><button type="button" aria-pressed={decision === "all"} onClick={() => onDecision("all")}>All</button><button type="button" aria-pressed={decision === "PROMOTE"} onClick={() => onDecision("PROMOTE")}>Promoted</button><button type="button" aria-pressed={decision === "DEMOTE"} onClick={() => onDecision("DEMOTE")}>Demoted</button></div></div><table className="rtable"><thead><tr><th><button type="button" onClick={() => selectSort("rank")}>Rank <span className="arrow">{sort === "rank" ? direction === 1 ? "↑" : "↓" : "↕"}</span></button></th><th>Asset</th><th><button type="button" onClick={() => selectSort("score")}>Opportunity <span className="arrow">{sort === "score" ? direction === 1 ? "↑" : "↓" : "↕"}</span></button></th><th><button type="button" onClick={() => selectSort("delta")}>Δ <span className="arrow">{sort === "delta" ? direction === 1 ? "↑" : "↓" : "↕"}</span></button></th><th>Jev</th></tr></thead><tbody>{rows.map((asset) => <tr key={asset.symbol} className={asset.currentRank === 1 ? "top" : undefined} onClick={() => router.push(`/stock/${asset.symbol}`)}><td className="pos">{String(asset.currentRank).padStart(2, "0")}</td><td className="asset"><b>{asset.symbol}</b><span>{asset.name.replace(" Stock Token", "")}</span></td><td><span className="mbar"><span>{asset.opportunityScore.toFixed(1)}</span><i style={{ "--w": `${asset.opportunityScore}%` } as CSSProperties} /></span></td><td className={`delta ${asset.rankMovement > 0 ? "up" : asset.rankMovement < 0 ? "dn" : "flat"}`}>{asset.rankMovement > 0 ? `▲+${asset.rankMovement}` : asset.rankMovement < 0 ? `▼${Math.abs(asset.rankMovement)}` : "—"}</td><td className={`dec-tag ${asset.jevDecision === "PROMOTE" ? "promote" : asset.rankMovement < 0 ? "demote" : ""}`}>{asset.jevDecision.replaceAll("_", " ")}</td></tr>)}</tbody></table><div className="panel-foot"><span className="label">Pairability measure, not an investment-return prediction. Click a row for the full stock page.</span></div></div>;
}

function MarketMap({ assets }: { assets: Stock[] }) {
  const positions = assets.map((asset, index) => ({ asset, x: 72 + (index % 5) * 120, y: 238 - Math.min(180, asset.opportunityScore * 1.6) }));
  return <div className="mapbox"><svg viewBox="0 0 640 340" role="img" aria-label="Assets plotted by meme compatibility and narrative strength"><g className="mesh"><line x1="40" y1="20" x2="620" y2="20" /><line x1="40" y1="90" x2="620" y2="90" /><line x1="40" y1="160" x2="620" y2="160" /><line x1="40" y1="230" x2="620" y2="230" /><line x1="170" y1="20" x2="170" y2="280" /><line x1="300" y1="20" x2="300" y2="280" /><line x1="430" y1="20" x2="430" y2="280" /><line x1="560" y1="20" x2="560" y2="280" /></g><line className="axis" x1="40" y1="280" x2="620" y2="280" /><line className="axis" x1="40" y1="20" x2="40" y2="280" /><text className="axis-t" x="40" y="300">MEME COMPATIBILITY →</text><text className="axis-t" x="0" y="150">↑ NARR.</text>{positions.map(({ asset, x, y }) => <g key={asset.symbol}><circle className={`mm-dot${asset.symbol === "NVDA" ? " sel" : ""}`} cx={x} cy={y} r={asset.symbol === "NVDA" ? 5 : 3.5} /><text className={`mm-l${asset.symbol === "NVDA" ? " sel" : ""}`} x={x + 9} y={y + 4}>{asset.symbol}</text>{asset.symbol === "NVDA" ? <circle className="mm-ring" cx={x} cy={y} r={11} /> : null}</g>)}</svg><div className="legend-float"><b>NVDA / #01</b>Opportunity 96.8<br />Pair · $GPU 95.4</div></div>;
}

function DecisionTrace({ agent, memory }: { agent: AgentRuntime; memory: MemoryRecord[] }) {
  const events = [...agent.latestEvents, ...memory.slice(0, 5).map((record) => ({ id: record.id, timestamp: record.timestamp, type: record.eventType, subject: record.subject, summary: record.summary }))];
  return <div className="tabpanel active"><ol className="feed">{events.map((event) => <li key={event.id} className={event.type === "JEV_DECISION" ? "k" : undefined}><span className="t">{formatClock(event.timestamp)}</span><span>{event.summary}</span></li>)}</ol></div>;
}

function PairingAction({ pairing }: { pairing: Pairing }) {
  return <div className="side-panel-body"><div className="kicker"><span className="label">Top proposal</span><span className="label on">Agent proposed</span></div><div className="pairname">{pairing.stockSymbol} × {pairing.symbol}</div><div className="srow"><span>Pairing score</span><span><b>{pairing.pairScore}</b></span></div><div className="srow"><span>Jev analysis</span><span className="label on">Strong pair · {pairing.confidence}%</span></div><p className="side-copy">{pairing.thesis.core}</p><Link className="side-cta" href="/pairing">Open pairing marketplace →</Link></div>;
}

function LaunchAction({ launch, pairing, passedChecks }: { launch: Launch; pairing: Pairing; passedChecks: number }) {
  return <div className="side-panel-body"><div className="kicker"><span className="label">Next candidate</span><span className="label on">Preparing</span></div><div className="pairname">{pairing.stockSymbol} × {pairing.symbol}</div><span className="label">Time to next stage</span><div className="clock-sm">T-{formatCountdown(launch.countdownSeconds)}</div><div className="stagebar">{launch.stages.map((stage) => <i key={stage.id} className={stage.status === "COMPLETE" ? "done" : stage.status === "ACTIVE" ? "now" : undefined} />)}</div><div className="srow"><span>Pre-launch checks</span><span><b>{passedChecks} / {launch.policyChecks.length}</b></span></div><div className="srow"><span>Transaction</span><span className="label on">Not submitted</span></div><Link className="side-cta" href="/launch">Open launch cycle →</Link></div>;
}

function ExploreRow({ pairings, memory }: { pairings: Pairing[]; memory: MemoryRecord[] }) {
  return <section className="explore" aria-label="Explore JEVO"><Link className="xcard" href="/stock/NVDA"><div className="xtop"><span className="explore-icon">⌁</span><span className="badge">Market</span></div><h4>Stock intelligence</h4><p>Rank, signals, decision trace and history for every evaluated Stock Token.</p><span className="go">Open NVDA ↗</span></Link><Link className="xcard" href="/pairing"><div className="xtop"><span className="explore-icon">◌</span><span className="badge">Agent</span></div><h4>Pairing marketplace</h4><p>{pairings.length} proposed stock × meme theses ready for review.</p><span className="go">Explore →</span></Link><Link className="xcard" href="/launch"><div className="xtop"><span className="explore-icon">↗</span><span className="badge">Protocol</span></div><h4>Autonomous launch</h4><p>Policy-checked cycle from candidate to controlled execution.</p><span className="go">Explore →</span></Link><Link className="xcard" href="/memory"><div className="xtop"><span className="explore-icon">◷</span><span className="badge">State</span></div><h4>Agent memory</h4><p>{memory.length} observable records retained across the active cycle.</p><span className="go">Explore →</span></Link><Link className="xcard restricted" href="/admin"><div className="xtop"><span className="explore-icon">◇</span><span className="badge">Restricted</span></div><h4>Admin console</h4><p>Operator controls, JEV decision review and launch approvals.</p><span className="go">Requires access ↗</span></Link></section>;
}
