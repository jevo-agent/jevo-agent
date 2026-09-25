import { formatCountdown } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface AppStatusStripProps { agent: AgentRuntime; asset: Stock; pairing: Pairing; }

export function AppStatusStrip({ agent, asset, pairing }: AppStatusStripProps) {
  return <div className="ref-statusbar" aria-label="Current JEVO system state"><span className="it">Cycle <b>{agent.activeCycle}</b></span><span className="it">Last decision <b>{agent.lastDecisionAgeSeconds}s</b> ago</span><span className="it">Next cycle <b>{formatCountdown(agent.nextCycleInSeconds).slice(3)}</b></span><span className="it">Data age <b>{agent.dataFreshness}</b></span><span className="it">State <b className="on">{agent.currentOperation.replace("SCANNING ", "")}</b></span><span className="it ref-status-context">{asset.symbol} #{String(asset.currentRank).padStart(2, "0")} · {pairing.symbol}</span></div>;
}
