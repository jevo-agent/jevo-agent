"use client";

import { useAgentStore } from "@/store/agent-store";

type FilterValue = "ALL" | "JEV_DECISION" | "MEMORY" | "PAIRING" | "LAUNCH";
const filters: { label: string; value: FilterValue }[] = [{ label: "All memory", value: "ALL" }, { label: "Decisions", value: "JEV_DECISION" }, { label: "Rank changes", value: "MEMORY" }, { label: "Pairings", value: "PAIRING" }, { label: "Launch", value: "LAUNCH" }];

export function MemoryFilters() {
  const memoryFilter = useAgentStore((state) => state.memoryFilter);
  const setMemoryFilter = useAgentStore((state) => state.setMemoryFilter);
  const memorySearch = useAgentStore((state) => state.memorySearch);
  const setMemorySearch = useAgentStore((state) => state.setMemorySearch);
  return <section aria-label="Memory search and filters" className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_56%)]"><div className="protocol-shell grid gap-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><label className="sr-only" htmlFor="memory-search">Search agent memory</label><input id="memory-search" name="memory-search" autoComplete="off" type="search" value={memorySearch} onChange={(event) => setMemorySearch(event.target.value)} placeholder="Search asset, decision, pair, cycle…" className="h-10 w-full border border-[var(--jevo-line)] bg-white/1 px-3 font-mono text-[0.67rem] tracking-[0.05em] text-[var(--jevo-text)] uppercase placeholder:text-[var(--jevo-muted)] md:max-w-108" /><div className="flex flex-wrap gap-2 md:justify-end">{filters.map((filter) => <button key={filter.value} type="button" aria-pressed={memoryFilter === filter.value} onClick={() => setMemoryFilter(filter.value)} className={memoryFilter === filter.value ? "h-9 border border-[rgb(2_198_165_/_28%)] bg-[var(--jevo-accent-soft)] px-3 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "h-9 border border-[var(--jevo-line)] px-3 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-text)]"}>{filter.label}</button>)}</div></div></section>;
}
