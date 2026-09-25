import type { AgentRuntime } from "@/types/agent";

export function AppTopbar({ agent }: { agent: AgentRuntime }) {
  return <header className="ref-topbar"><div className="crumbs">JEVO <span>/</span> AGENT <span>/</span> <b>Current workspace</b></div><div className="top-right"><span className="pill">● Robinhood Chain <b>Mainnet</b></span><span className="pill">Chain ID <b>4663</b></span><div className="avatar" title="Read-only viewer">C</div></div><span className="sr-only">{agent.networkLabel} read-only viewer workspace</span></header>;
}
