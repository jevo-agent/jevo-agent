import type { ReactNode } from "react";
import type { AgentRuntime } from "@/types/agent";
import { formatCountdown } from "@/lib/format";

export function AppTopbar({ agent, breadcrumb }: { agent: AgentRuntime; breadcrumb?: ReactNode }) {
  return (
    <header className="ref-topbar">
      {breadcrumb ?? (
        <div className="crumbs">
          JEVO <span>/</span> AGENT <span>/</span> <b>Operational overview</b>
        </div>
      )}
      <div className="top-right">
        <div className="top-telemetry top-cycle"><span className="top-telemetry-label">Cycle</span><b>{agent.activeCycle}</b></div>
        <div className="top-telemetry"><span className="top-telemetry-label">Last</span><b>{agent.lastDecisionAgeSeconds}s</b></div>
        <div className="top-telemetry"><span className="top-telemetry-label">Next</span><b>{formatCountdown(agent.nextCycleInSeconds)}</b></div>
        <div className="top-telemetry top-network"><span className="top-telemetry-label">Network</span><b>{agent.networkLabel} · Phase 0</b></div>
        <div className="top-telemetry top-live"><span className="live-dot" aria-hidden="true" /><span className="top-telemetry-label">JEV</span><b>{agent.jevStatus}</b></div>
      </div>
      <span className="sr-only">{agent.networkLabel} read-only viewer workspace</span>
    </header>
  );
}
