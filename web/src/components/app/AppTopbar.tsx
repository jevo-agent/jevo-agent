"use client";

import { useState, useEffect, type ReactNode } from "react";
import type { AgentRuntime } from "@/types/agent";
import { formatCountdown } from "@/lib/format";
import { formatCycle } from "@/lib/format";

export function AppTopbar({ agent, breadcrumb }: { agent: AgentRuntime; breadcrumb?: ReactNode }) {
  const [nextSeconds, setNextSeconds] = useState(agent.nextCycleInSeconds ?? 134);
  const [lastSeconds, setLastSeconds] = useState(agent.lastDecisionAgeSeconds ?? 12);

  useEffect(() => {
    setNextSeconds(agent.nextCycleInSeconds ?? 134);
    setLastSeconds(agent.lastDecisionAgeSeconds ?? 12);

    const timer = setInterval(() => {
      setNextSeconds((prev) => (prev > 1 ? prev - 1 : 180));
      setLastSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [agent.nextCycleInSeconds, agent.lastDecisionAgeSeconds]);

  return (
    <header className="ref-topbar">
      {breadcrumb ?? (
        <div className="crumbs">
          JEVO <span>/</span> AGENT <span>/</span> <b>Operational overview</b>
        </div>
      )}
      <div className="top-right">
        <div className="top-telemetry top-cycle"><span className="top-telemetry-label">Cycle</span><b>{formatCycle(agent.activeCycle)}</b></div>
        <div className="top-telemetry"><span className="top-telemetry-label">Last</span><b>{lastSeconds}s</b></div>
        <div className="top-telemetry"><span className="top-telemetry-label">Next</span><b>{formatCountdown(nextSeconds)}</b></div>
        <div className="top-telemetry top-network"><span className="top-telemetry-label">Network</span><b>{agent.networkLabel ? `${agent.networkLabel} · Phase 0` : "UNAVAILABLE · Phase 0"}</b></div>
        <div className="top-telemetry top-live"><span className="live-dot" aria-hidden="true" /><span className="top-telemetry-label">JEV</span><b>{agent.jevStatus}</b></div>
      </div>
      <span className="sr-only">{agent.networkLabel ?? "Network unavailable"} read-only viewer workspace</span>
    </header>
  );
}
