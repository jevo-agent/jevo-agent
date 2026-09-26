"use client";

import { useMemo, useRef, useState } from "react";

import { formatClock, formatCycle } from "@/lib/format";
import { groupMemoryRecords, type GroupedAuditEntry } from "@/lib/memory/grouping";
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
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  const rankPoints = useMemo(() => {
    return asset.rankHistory.map((entry, index) => `${pointX(index, asset.rankHistory.length)},${rankY(entry.rank)}`).join(" ");
  }, [asset.rankHistory]);

  const scorePoints = useMemo(() => {
    return asset.scoreHistory.map((entry, index) => `${pointX(index, asset.scoreHistory.length)},${scoreY(entry.score)}`).join(" ");
  }, [asset.scoreHistory]);

  // Group consecutive identical records using the reusable utility
  const auditGroups = useMemo(() => {
    return groupMemoryRecords(memory);
  }, [memory]);

  // Determine if history has been in steady state
  const isSteadyState = useMemo(() => {
    if (asset.rankHistory.length <= 1) return true;
    const firstRank = asset.rankHistory[0]?.rank;
    const allRanksSame = asset.rankHistory.every((r) => r.rank === firstRank);
    const firstScore = asset.scoreHistory[0]?.score ?? asset.opportunityScore;
    const allScoresClose = asset.scoreHistory.every((s) => Math.abs(s.score - firstScore) < 0.2);
    return allRanksSame && allScoresClose;
  }, [asset.rankHistory, asset.scoreHistory, asset.opportunityScore]);

  // Significant milestones (rank changes or initial/latest points)
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

  const earliestTimestamp = asset.rankHistory[0]?.timestamp;
  const latestTimestamp = asset.rankHistory[asset.rankHistory.length - 1]?.timestamp;
  const totalDurationMinutes = useMemo(() => {
    if (!earliestTimestamp || !latestTimestamp) return 1;
    const diff = Math.abs(new Date(latestTimestamp).getTime() - new Date(earliestTimestamp).getTime());
    return Math.max(1, Math.round(diff / 60000));
  }, [earliestTimestamp, latestTimestamp]);

  const activeIndex = inspectedIndex ?? (asset.rankHistory.length - 1);
  const activeRank = asset.rankHistory[activeIndex]?.rank ?? asset.currentRank;
  const activeScore = asset.scoreHistory[activeIndex]?.score ?? asset.opportunityScore;
  const activeTime = asset.rankHistory[activeIndex]?.timestamp ?? latestTimestamp;

  const rankEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("rank"));
  const narrativeEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("narrative"));
  const pairEntry = comparison.entries.find((entry) => entry.label.toLowerCase().includes("pair score"));

  // Toggle expand / collapse for grouped cards
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Jump from timeline milestone node to decisions log entry
  const handleMilestoneClick = (timestamp: string, milestoneIndex: number) => {
    setInspectedIndex(milestoneIndex);

    // Find corresponding audit group
    const targetTime = new Date(timestamp).getTime();
    const targetGroup = auditGroups.find((g) => {
      const start = new Date(g.earliestTimestamp).getTime();
      const end = new Date(g.latestTimestamp).getTime();
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      return targetTime >= min && targetTime <= max;
    }) ?? auditGroups[0];

    if (targetGroup) {
      setHighlightedGroupId(targetGroup.id);
      // Auto-expand group to allow viewing the raw items
      setExpandedGroupIds((prev) => new Set(prev).add(targetGroup.id));

      const cardEl = document.getElementById(`mlog-card-${targetGroup.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => {
        setHighlightedGroupId(null);
      }, 3500);
    }
  };

  return (
    <section className="app-reference-view memory-view-refined">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h2>Agent memory</h2>
          <p>Audit why an asset rose, held rank, or changed state instead of trusting a single aggregate score.</p>
        </div>
        <div className="mem-head-meta">
          <span className="label">
            Asset <b>{asset.symbol}</b> · {isSteadyState ? "Steady state" : "Active transition"}
          </span>
          <span className="mem-head-counter">
            {asset.rankHistory.length} cycles ({totalDurationMinutes}m audit window)
          </span>
        </div>
      </div>

      {/* Main Grid: Chart + Grouped Decisions */}
      <div className="mem-grid">
        <div className="mem-main-col">
          {/* Historical SVG Chart */}
          <div className="mem-chart">
            <div className="plane-meta mem-chart-meta">
              <div className="mem-meta-left">
                <span className="label">
                  <b>{asset.symbol}</b> / rank <span className="on">#{String(activeRank).padStart(2, "0")}</span> &nbsp;score <span className="score-muted">{activeScore.toFixed(1)}</span>
                </span>
                <span className="mem-active-time">
                  {formatClock(activeTime)} UTC {inspectedIndex !== null ? "(inspected)" : "(latest)"}
                </span>
              </div>
              <div className="mem-meta-right">
                {isSteadyState ? (
                  <span className="mem-status-pill mem-status-pill--steady" title="No material signal delta across recent cycles; skip-gate carried forward canonical evaluation.">
                    ● Steady state · 0 rank drift ({asset.rankHistory.length} cycles)
                  </span>
                ) : (
                  <span className="mem-status-pill mem-status-pill--active">
                    ▲ Transition observed · Rank #{asset.currentRank}
                  </span>
                )}
              </div>
            </div>

            <svg
              viewBox="0 0 800 220"
              role="img"
              aria-label={`${asset.symbol} rank history #${String(asset.rankHistory[0]?.rank ?? "01")} to #${String(asset.currentRank)} and score history from ${asset.scoreHistory[0]?.score?.toFixed(1) ?? "—"} to ${asset.opportunityScore.toFixed(1)}`}
            >
              {/* Subtle Qualified Zone Band (#01 to #03 threshold) */}
              <rect x="0" y="16" width="800" height="42" fill="var(--accent)" fillOpacity="0.04" />
              <text x="790" y="32" textAnchor="end" className="mem-zone-label" fill="var(--accent)" fillOpacity="0.4">
                #01 QUALIFIED ZONE
              </text>

              {/* Grid Lines */}
              <line className="mem-axis" x1="0" y1="200" x2="800" y2="200" />
              <line className="mem-axis" x1="0" y1="20" x2="800" y2="20" strokeDasharray="2 5" />
              <line className="mem-axis" x1="0" y1="110" x2="800" y2="110" strokeDasharray="1 8" strokeOpacity="0.4" />
              <text className="axis-t" x="0" y="14">#01</text>
              <text className="axis-t" x="0" y="208">#10</text>

              {/* Watermark in Steady State */}
              {isSteadyState && (
                <g className="mem-steady-watermark-group" aria-hidden="true">
                  <text className="mem-steady-watermark" x="400" y="125" textAnchor="middle">
                    STEADY STATE · RANK #{String(asset.currentRank).padStart(2, "0")} CONSOLIDATED OVER {asset.rankHistory.length} CYCLES
                  </text>
                </g>
              )}

              {/* Score & Rank Polylines */}
              <polyline className="mem-score" points={scorePoints} />
              <polyline className="mem-rank" points={rankPoints} />

              {/* Interactive Milestone Nodes (Start, Changes, End) */}
              {asset.rankHistory.map((entry, index) => {
                const isMilestone = index === 0 || index === asset.rankHistory.length - 1 || milestones.some((m) => m.index === index);
                if (!isMilestone && asset.rankHistory.length > 10) return null;

                const cx = pointX(index, asset.rankHistory.length);
                const cy = rankY(entry.rank);
                const isSelected = activeIndex === index;
                const isLatest = index === asset.rankHistory.length - 1;

                return (
                  <g
                    key={`${entry.timestamp}-${entry.rank}-${index}`}
                    className={`mem-pt-group ${isSelected ? "is-selected" : ""} ${isLatest ? "is-latest" : ""}`}
                    onMouseEnter={() => setInspectedIndex(index)}
                    onMouseLeave={() => setInspectedIndex(null)}
                    onClick={() => handleMilestoneClick(entry.timestamp, index)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Cycle at ${formatClock(entry.timestamp)}, rank #${entry.rank}, score ${asset.scoreHistory[index]?.score ?? asset.opportunityScore}. Activate to jump to log.`}
                  >
                    {isLatest && <circle className="mem-pt-halo" cx={cx} cy={cy} r="10" />}
                    <circle
                      className="mem-pt"
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6.5 : isLatest ? 5.5 : 4}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Consolidated Timeline Bar with Interactive Milestone Anchors */}
          <div className="mem-timeline-bar" role="region" aria-label="Consolidated cycle timeline">
            <div
              className="mem-tl-anchor mem-tl-anchor--start is-clickable"
              onClick={() => earliestTimestamp && handleMilestoneClick(earliestTimestamp, 0)}
              role="button"
              tabIndex={0}
              title="Click to view initial audit cycle in log"
            >
              <span className="mem-tl-label">WINDOW START</span>
              <span className="mem-tl-time">{formatClock(earliestTimestamp).slice(0, 5)} UTC</span>
              <span className="mem-tl-stat">Rank #{String(asset.rankHistory[0]?.rank ?? asset.currentRank).padStart(2, "0")} @ {(asset.scoreHistory[0]?.score ?? asset.opportunityScore).toFixed(1)}</span>
            </div>

            <div className="mem-tl-track">
              {isSteadyState ? (
                <div
                  className="mem-tl-track-steady is-clickable"
                  onClick={() => latestTimestamp && handleMilestoneClick(latestTimestamp, asset.rankHistory.length - 1)}
                  role="button"
                  tabIndex={0}
                  title="Click to highlight consolidation entry in log"
                >
                  <div className="mem-tl-rail-line" />
                  <div className="mem-tl-steady-badge">
                    <span className="dot" aria-hidden="true" />
                    <b>Unchanged for {totalDurationMinutes}m</b> · {asset.rankHistory.length} cycles without drift
                  </div>
                  <span className="mem-tl-sub">Skip-gate active · Click to inspect audit group</span>
                </div>
              ) : (
                <div className="mem-tl-track-transitions">
                  <div className="mem-tl-rail-line" />
                  <div className="mem-tl-milestones-row">
                    {milestones.map((m, idx) => (
                      <div
                        key={m.index}
                        className={`mem-tl-node ${m.isChange ? "is-change" : ""}`}
                        onClick={() => handleMilestoneClick(m.timestamp, m.index)}
                        role="button"
                        tabIndex={0}
                        title={`Click to jump to ${m.isChange ? "transition" : "snapshot"} in decisions log`}
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
              onClick={() => latestTimestamp && handleMilestoneClick(latestTimestamp, asset.rankHistory.length - 1)}
              role="button"
              tabIndex={0}
              title="Click to view latest active cycle in log"
            >
              <span className="mem-tl-label">CURRENT STATE</span>
              <span className="mem-tl-time">{formatClock(latestTimestamp).slice(0, 5)} UTC</span>
              <span className="mem-tl-stat mem-tl-stat--active">
                Rank #{String(asset.currentRank).padStart(2, "0")} @ {asset.opportunityScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Decisions Audit Trail: Grouped, Expandable, and Non-repetitive */}
        <div className="mem-decisions-col">
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
                const isExpanded = expandedGroupIds.has(group.id);
                const isHighlighted = highlightedGroupId === group.id;

                if (group.isChange) {
                  // High-priority highlight for moments of change
                  return (
                    <li
                      id={`mlog-card-${group.id}`}
                      key={group.id}
                      className={`mlog-card mlog-card--change${isHighlighted ? " is-target-highlight" : ""}`}
                    >
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

                // Consolidated representation for steady-state intervals
                const isGrouped = group.count > 1;
                return (
                  <li
                    id={`mlog-card-${group.id}`}
                    key={group.id}
                    className={`mlog-card mlog-card--steady${isHighlighted ? " is-target-highlight" : ""}`}
                  >
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
                        Skip-gate active: market & social signals remained steady (delta &lt; 0.001). Carried forward prior canonical evaluation.
                      </p>

                      {/* Interactive Expand / Collapse for full audit access */}
                      {isGrouped && (
                        <div className="mlog-expand-container">
                          <button
                            type="button"
                            className="mlog-expand-btn"
                            aria-expanded={isExpanded}
                            onClick={() => toggleGroupExpand(group.id)}
                          >
                            {isExpanded ? "▲ Collapse raw cycle log" : `▼ Audit all ${group.count} individual cycles`}
                          </button>

                          {isExpanded && (
                            <div className="mlog-raw-table-wrap">
                              <table className="mlog-raw-table">
                                <thead>
                                  <tr>
                                    <th>UTC</th>
                                    <th>Rank</th>
                                    <th>Score</th>
                                    <th>Decision</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.records.map((r) => {
                                    const parsed = r.currentState.match(/score:\s*([\d.]+)/i);
                                    const s = parsed ? parsed[1] : (group.score?.toFixed(1) ?? "—");
                                    return (
                                      <tr key={r.id}>
                                        <td>{formatClock(r.timestamp).slice(0, 8)}</td>
                                        <td>#{String(group.rank ?? asset.currentRank).padStart(2, "0")}</td>
                                        <td>{s}</td>
                                        <td>{r.decision}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        </div>
      </div>

      {/* Comparative State Transition Summary */}
      <div className="transition">
        <div>
          <span className="label">Previous state</span>
          <span className="big">
            {rankEntry?.previous ?? (asset.previousRank === null || asset.previousScore === null ? `#${asset.currentRank} / ${asset.opportunityScore.toFixed(1)}` : `#${asset.previousRank} / ${asset.previousScore.toFixed(1)}`)}
          </span>
          <p>
            Cycle {comparison.previousCycle ?? "prior"}; {isSteadyState ? "identical to current (steady-state holding)." : "retained for audit comparison."}
          </p>
        </div>
        <div>
          <span className="label">Observed change</span>
          <span className="big">
            {narrativeEntry?.delta ?? (isSteadyState ? "0.0 (Steady)" : "Signal shift")}
          </span>
          <p>
            {isSteadyState
              ? "Skip-gate active: 0 material delta detected, carrying forward prior evaluation."
              : narrativeEntry ? "Worker-persisted evidence changed between cycles." : "Structured state delta recorded."}
          </p>
        </div>
        <div>
          <span className="label">JEV decision</span>
          <span className="big on">{asset.jevDecision.replaceAll("_", " ")}</span>
          <p>
            Confidence {asset.confidence === null ? "UNAVAILABLE" : `${asset.confidence}%`}. Evaluated by model.
          </p>
        </div>
        <div>
          <span className="label">Current state</span>
          <span className="big on">
            {rankEntry?.current ?? `#${asset.currentRank} / ${asset.opportunityScore.toFixed(1)}`}
          </span>
          <p>
            Cycle {formatCycle(agent.activeCycle)}. Verified canonical state from worker.
          </p>
        </div>
      </div>

      {/* Bottom Telemetry Note */}
      <div className="memory-cycle-note">
        <span className="label">
          Cycle {formatCycle(agent.activeCycle)} / {cycles[0]?.summary ?? "Current worker cycle"}
        </span>
        <span className="label">
          {pairEntry ? `Pair score ${pairEntry.current}` : "No pairing state recorded"} / {memory.length} raw cycles audited / {agent.dataFreshness}
        </span>
      </div>
    </section>
  );
}
