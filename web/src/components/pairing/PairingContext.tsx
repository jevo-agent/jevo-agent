import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";

interface PairingContextProps { pairings: Pairing[]; agent: AgentRuntime; }

export function PairingContext({ pairings, agent }: PairingContextProps) {
  const proposed = pairings.filter((pairing) => pairing.status === "AGENT_PROPOSED").length;
  const curated = pairings.filter((pairing) => pairing.status === "CURATED").length;
  const launchCandidates = pairings.filter((pairing) => pairing.status === "LAUNCH_CANDIDATE").length;

  return (
    <section className="border-t border-[var(--jevo-line)] py-20 sm:py-24" aria-labelledby="pairing-context-title">
      <div className="protocol-shell"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] pb-4"><p id="pairing-context-title" className="protocol-label">Marketplace context</p><p className="font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">Why this is not top-stock sorting</p></div><div className="grid border-b border-[var(--jevo-line)] lg:grid-cols-3"><article className="border-b border-[var(--jevo-line)] py-7 lg:border-r lg:border-b-0 lg:pr-7"><p className="protocol-label">Independent thesis</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.07em] text-[var(--jevo-text)]">Pair score ≠ stock rank.</h2><p className="mt-4 max-w-md leading-7 text-[var(--jevo-muted)]">A stock can rank highly without producing the strongest meme pairing. JEV evaluates narrative, culture, crypto fit, and timing independently.</p></article><article className="border-b border-[var(--jevo-line)] py-7 lg:border-r lg:border-b-0 lg:px-7"><p className="protocol-label">Current pipeline</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.07em] text-[var(--jevo-text)]">Agent proposed → human curated.</h2><dl className="mt-5 font-mono text-[0.65rem] tracking-[0.07em] uppercase"><ContextLine label="Agent proposed" value={proposed.toString()} /><ContextLine label="Curated" value={curated.toString()} /><ContextLine label="Launch candidate" value={launchCandidates.toString()} /></dl></article><article className="py-7 lg:pl-7"><p className="protocol-label">Decision freshness</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.07em] text-[var(--jevo-text)]">Every proposal has a current state.</h2><dl className="mt-5 font-mono text-[0.65rem] tracking-[0.07em] uppercase"><ContextLine label="Data freshness" value={agent.dataFreshness} /><ContextLine label="Next evaluation" value={`${Math.floor(agent.nextCycleInSeconds / 60)}:${String(agent.nextCycleInSeconds % 60).padStart(2, "0")}`} /><ContextLine label="Active cycle" value={agent.activeCycle.toString()} /></dl></article></div></div>
    </section>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[var(--jevo-line)] py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="text-[var(--jevo-text)]">{value}</dd></div>;
}
