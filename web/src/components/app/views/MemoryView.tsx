"use client";

import { formatClock } from "@/lib/format";
import type { AgentCycle, AgentRuntime, MemoryComparison, MemoryRecord } from "@/types/agent";
import type { Stock } from "@/types/stock";

interface MemoryViewProps {
  asset: Stock;
  agent: AgentRuntime;
  cycles: AgentCycle[];
  memory: MemoryRecord[];
  comparison: MemoryComparison;
}

function pointX(index: number, length: number) {
  return length <= 1 ? 400 : 40 + (index * 720) / (length - 1);
}

function scoreY(score: number) {
  return 195 - (Math.max(0, Math.min(100, score)) / 100) * 170;
}

function rankY(rank: number) {
  return 25 + (Math.max(1, Math.min(10, rank)) - 1) * 17;
}

export function MemoryView({ asset, agent, cycles, memory, comparison }: MemoryViewProps) {
  const rankPoints = asset.rankHistory.map((entry, index) => `${pointX(index, asset.rankHistory.length)},${rankY(entry.rank)}`).join(" ");
  const scorePoints = asset.scoreHistory.map((entry, index) => `${pointX(index, asset.scoreHistory.length)},${scoreY(entry.score)}`).join(" ");
  const latestRecords = memory.slice(0, 7);
  const rankEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("rank"));
  const narrativeEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("narrative"));
  const pairEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("pair score"));

  return (
    <section className="app-reference-view">
      <div className="page-head">
        <div>
          <h2>Agent memory</h2>
          <p>Every cycle is stored — rank, score, structured signals and observable state changes remain auditable.</p>
        </div>
        <span className="label">Showing <b>{asset.symbol}</b> · worker state</span>
      </div>
      <div className="mem-grid">
        <div>
          <div className="mem-chart">
            <div className="plane-meta">
              <span className="label"><b>{asset.symbol}</b> / rank <span className="on">#{String(asset.currentRank).padStart(2, "0")}</span> &nbsp;score <span className="score-muted">{asset.opportunityScore.toFixed(1)}</span></span>
              <span className="label">UTC / persisted history</span>
            </div>
            <svg viewBox="0 0 800 220" role="img" aria-label={`${asset.symbol} rank history from ${asset.rankHistory[0]?.rank ?? "—"} to ${asset.currentRank} and score history from ${asset.scoreHistory[0]?.score ?? "—"} to ${asset.opportunityScore}`}>
              <line className="mem-axis" x1="0" y1="200" x2="800" y2="200" />
              <line className="mem-axis" x1="0" y1="20" x2="800" y2="20" strokeDasharray="2 5" />
              <text className="axis-t" x="0" y="14">#01</text>
              <polyline className="mem-score" points={scorePoints} />
              <polyline className="mem-rank" points={rankPoints} />
              {asset.rankHistory.map((entry, index) => <circle key={`${entry.timestamp}-${entry.rank}`} className="mem-pt" cx={pointX(index, asset.rankHistory.length)} cy={rankY(entry.rank)} r={index === asset.rankHistory.length - 1 ? 6 : 5} />)}
            </svg>
          </div>
          <div className="snap">
            {asset.rankHistory.map((entry, index) => <div key={`${entry.timestamp}-${entry.rank}`}><span className="label">{formatClock(entry.timestamp).slice(0, 5)}</span><b>#{String(entry.rank).padStart(2, "0")}</b><span className="label">{asset.scoreHistory[index]?.score ?? "—"}</span></div>)}
          </div>
        </div>
        <ol className="mlog" aria-label="Observable decision events">
          {latestRecords.map((record) => <li key={record.id} className={record.eventType === "JEV_DECISION" ? "k" : undefined}><span className="t">{formatClock(record.timestamp)}</span><span>{record.summary}</span></li>)}
        </ol>
      </div>
      <div className="transition">
        <div><span className="label">Previous state</span><span className="big">{rankEntry?.previous ?? `#${asset.previousRank} / ${asset.previousScore}`}</span><p>Cycle {comparison.previousCycle}; prior worker state retained for comparison.</p></div>
        <div><span className="label">Observed change</span><span className="big">{narrativeEntry?.delta ?? "No structured delta"}</span><p>{narrativeEntry ? "Worker-persisted evidence changed between cycles." : "No additional structured change was published."}</p></div>
        <div><span className="label">JEV decision</span><span className="big on">{asset.jevDecision.replaceAll("_", " ")}</span><p>Confidence {asset.confidence}%. Structured output only.</p></div>
        <div><span className="label">Current state</span><span className="big on">{rankEntry?.current ?? `#${asset.currentRank} / ${asset.opportunityScore}`}</span><p>Cycle {comparison.currentCycle}. State comes from the worker API.</p></div>
      </div>
      <div className="memory-cycle-note"><span className="label">Cycle {agent.activeCycle} / {cycles[0]?.summary ?? "Current worker cycle"}</span><span className="label">{pairEntry ? `Pair score ${pairEntry.current}` : "No pairing state recorded"} / {memory.length} records retained / {agent.dataFreshness}</span></div>
    </section>
  );
}
