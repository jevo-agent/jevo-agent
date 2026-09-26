import type { AgentRuntime } from "@/types/agent";

interface AgentStatusBarProps {
  agentStatus: AgentRuntime["status"];
  jevStatus: AgentRuntime["jevStatus"];
  currentOperation: AgentRuntime["currentOperation"];
  lastDecisionAgeSeconds: AgentRuntime["lastDecisionAgeSeconds"];
  nextCycleInSeconds: AgentRuntime["nextCycleInSeconds"];
  networkLabel: AgentRuntime["networkLabel"];
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0 ? `${seconds}s ago` : `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return "—";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function AgentStatusBar({
  agentStatus,
  jevStatus,
  currentOperation,
  lastDecisionAgeSeconds,
  nextCycleInSeconds,
  networkLabel,
}: AgentStatusBarProps) {
  return (
    <aside className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_88%)]" aria-label="JEVO agent status">
      <div className="protocol-shell grid gap-x-6 gap-y-3 py-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex items-center gap-2 text-[0.6875rem] font-medium tracking-[0.09em] text-[var(--jevo-text)] uppercase">
          <span className="size-1.5 rounded-full bg-[var(--jevo-accent)]" aria-hidden="true" />
          JEVO Agent {agentStatus}
        </div>
        <StatusItem label="JEV" value={jevStatus} accent />
        <StatusItem label="Market" value={currentOperation} />
        <StatusItem label="Last decision" value={formatDuration(lastDecisionAgeSeconds)} />
        <StatusItem label="Next cycle" value={formatCountdown(nextCycleInSeconds)} />
        <StatusItem label="Network" value={networkLabel} />
      </div>
    </aside>
  );
}

interface StatusItemProps { label: string; value: string; accent?: boolean; }

function StatusItem({ label, value, accent = false }: StatusItemProps) {
  return (
    <p className="m-0 font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">
      {label}: {" "}
      <span className={accent ? "text-[var(--jevo-accent)]" : "text-[var(--jevo-text)]"}>{value}</span>
    </p>
  );
}
