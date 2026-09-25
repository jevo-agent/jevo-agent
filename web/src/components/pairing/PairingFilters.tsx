"use client";

import { useAgentStore } from "@/store/agent-store";

const filters = [
  { value: "ALL", label: "All" },
  { value: "AGENT_PROPOSED", label: "Agent Proposed" },
  { value: "CURATED", label: "Curated" },
  { value: "LAUNCH_CANDIDATE", label: "Launch Candidate" },
] as const;

export function PairingFilters() {
  const pairingSearch = useAgentStore((state) => state.pairingSearch);
  const pairingFilter = useAgentStore((state) => state.pairingFilter);
  const setPairingSearch = useAgentStore((state) => state.setPairingSearch);
  const setPairingFilter = useAgentStore((state) => state.setPairingFilter);

  return (
    <section className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_56%)]" aria-label="Marketplace controls">
      <div className="protocol-shell grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div><label htmlFor="pairing-search" className="sr-only">Search stock or meme pairings</label><input id="pairing-search" name="pairing-search" autoComplete="off" type="search" value={pairingSearch} onChange={(event) => setPairingSearch(event.target.value)} placeholder="Search stock, meme, narrative…" className="w-full border border-[var(--jevo-line)] bg-[rgb(255_255_255_/_1.5%)] px-4 py-3 font-mono text-sm text-[var(--jevo-text)] placeholder:text-[var(--jevo-muted)] focus:border-[var(--jevo-accent)] focus:outline-none" /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pairings by status">
          {filters.map((filter) => <button key={filter.value} type="button" onClick={() => setPairingFilter(filter.value)} aria-pressed={pairingFilter === filter.value} className={pairingFilter === filter.value ? "border border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] px-3 py-2 font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "border border-[var(--jevo-line)] px-3 py-2 font-mono text-[0.625rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase transition-colors hover:border-[var(--jevo-line-strong)] hover:text-[var(--jevo-text)]"}>{filter.label}</button>)}
        </div>
      </div>
    </section>
  );
}
