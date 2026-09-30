"use client";

import { useState, useEffect } from "react";
import { formatCountdown, formatCycle } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface AppStatusStripProps { agent: AgentRuntime; asset: Stock | null; pairing?: Pairing | null; }

export function AppStatusStrip({ agent, asset, pairing }: AppStatusStripProps) {
  const [nextSeconds, setNextSeconds] = useState(
    agent.nextCycleInSeconds && agent.nextCycleInSeconds > 0 ? agent.nextCycleInSeconds : 134,
  );
  const [lastSeconds, setLastSeconds] = useState(agent.lastDecisionAgeSeconds ?? 12);

  useEffect(() => {
    setNextSeconds(
      agent.nextCycleInSeconds && agent.nextCycleInSeconds > 0 ? agent.nextCycleInSeconds : 134,
    );
    setLastSeconds(agent.lastDecisionAgeSeconds ?? 12);

    const timer = setInterval(() => {
      setNextSeconds((prev) => (prev > 1 ? prev - 1 : 180));
      setLastSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [agent.nextCycleInSeconds, agent.lastDecisionAgeSeconds]);

  return (
    <div className="ref-statusbar" aria-label="Current JEVO system state">
      <span className="it">Cycle <b>{formatCycle(agent.activeCycle)}</b></span>
      <span className="it">Last decision <b>{lastSeconds}s</b> ago</span>
      <span className="it">Next cycle <b>{formatCountdown(nextSeconds)}</b></span>
      <span className="it">Data age <b>{agent.dataFreshness}</b></span>
      <span className="it">State <b className="on">{agent.currentOperation.replace("SCANNING ", "")}</b></span>
      <span className="it ref-status-context">{asset ? `${asset.symbol} #${String(asset.currentRank).padStart(2, "0")}` : "OPPORTUNITY UNAVAILABLE"}{pairing ? ` · ${pairing.symbol}` : " · NO PAIR"}</span>
    </div>
  );
}
