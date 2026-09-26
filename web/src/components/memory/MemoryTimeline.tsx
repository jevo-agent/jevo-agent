"use client";

import { useEffect, useMemo } from "react";

import { MemoryEventRow } from "@/components/memory/MemoryEventRow";
import { useAgentStore } from "@/store/agent-store";
import type { MemoryRecord } from "@/types/agent";

interface MemoryTimelineProps { memory: MemoryRecord[]; }

export function MemoryTimeline({ memory }: MemoryTimelineProps) {
  const memoryFilter = useAgentStore((state) => state.memoryFilter);
  const memorySearch = useAgentStore((state) => state.memorySearch);
  const selectedMemoryEventId = useAgentStore((state) => state.selectedMemoryEventId);
  const setSelectedMemoryEventId = useAgentStore((state) => state.setSelectedMemoryEventId);
  const visibleMemory = useMemo(() => {
    const query = memorySearch.trim().toLowerCase();
    return memory.filter((event) => {
      const typeMatches = memoryFilter === "ALL" || event.eventType === memoryFilter;
      const searchable = [event.id, event.subject, event.eventType, event.decision, event.previousState, event.currentState, event.cycleId?.toString() ?? "UNAVAILABLE", event.summary, event.actor, ...event.structuredEvidence.flatMap((item) => [item.label, item.value])].join(" ").toLowerCase();
      return typeMatches && (!query || searchable.includes(query));
    });
  }, [memory, memoryFilter, memorySearch]);

  useEffect(() => { if (visibleMemory.length > 0 && !visibleMemory.some((event) => event.id === selectedMemoryEventId)) setSelectedMemoryEventId(visibleMemory[0].id); }, [selectedMemoryEventId, setSelectedMemoryEventId, visibleMemory]);

  return <section aria-labelledby="memory-timeline-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="memory-timeline-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Memory timeline</h2><p className="protocol-label">Newest first / observable state changes</p></div>{visibleMemory.length > 0 ? <ol className="relative py-2 before:absolute before:top-7 before:bottom-7 before:left-5 before:w-px before:bg-[var(--jevo-line)] sm:before:left-7">{visibleMemory.map((event) => <MemoryEventRow key={event.id} event={event} selected={event.id === selectedMemoryEventId} onSelect={() => setSelectedMemoryEventId(event.id)} />)}</ol> : <p className="px-6 py-10 text-sm leading-6 text-[var(--jevo-muted)]">No memory records match the current controls.</p>}</section>;
}
