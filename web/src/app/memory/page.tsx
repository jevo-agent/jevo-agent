"use client";

import { AppShell } from "@/components/app/AppShell";
import { MemoryView } from "@/components/app/views/MemoryView";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function AgentMemoryPage() {
  const state = useProtocolState();
  if (state.isLoading) return <QueryLoadingState title="Loading agent memory" />;
  if (state.isError) return <QueryErrorState title="Failed to Load Memory" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data) return <QueryEmptyState title="No canonical memory state" message="The worker has not published enough cycle and memory state for this view." />;
  return (
    <AppShell {...state.data}>
      <MemoryView asset={state.data.featuredAsset} agent={state.data.agent} cycles={state.data.agentCycles} memory={state.data.memory} comparison={state.data.memoryComparison} />
    </AppShell>
  );
}
