"use client";

import { AppShell } from "@/components/app/AppShell";
import { MemoryView } from "@/components/app/views/MemoryView";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useOpportunities, usePairings, useLaunches, useMemory, useCycles } from "@/lib/api/hooks";

export default function AgentMemoryPage() {
  const agentQuery = useAgentStatus();
  const oppsQuery = useOpportunities();
  const pairingsQuery = usePairings();
  const launchesQuery = useLaunches();
  const memoryQuery = useMemory();
  const cyclesQuery = useCycles();

  const isError =
    agentQuery.isError ||
    oppsQuery.isError ||
    pairingsQuery.isError ||
    launchesQuery.isError ||
    memoryQuery.isError ||
    cyclesQuery.isError;

  const error =
    memoryQuery.error ||
    cyclesQuery.error ||
    agentQuery.error ||
    oppsQuery.error ||
    pairingsQuery.error ||
    launchesQuery.error;

  const handleRefetch = () => {
    void agentQuery.refetch();
    void oppsQuery.refetch();
    void pairingsQuery.refetch();
    void launchesQuery.refetch();
    void memoryQuery.refetch();
    void cyclesQuery.refetch();
  };

  if (isError) {
    return (
      <QueryErrorState
        title="Failed to Load Memory"
        error={error}
        onRetry={handleRefetch}
      />
    );
  }

  const { agent, agentCycles, assets, ranking, pairings, launch, memory, memoryComparison } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !featuredPairing) throw new Error("The Memory view requires the shared NVDA opportunity and launch pairing.");

  return (
    <AppShell
      agent={agent}
      assets={assets}
      ranking={ranking}
      pairings={pairings}
      launch={launch}
      memory={memory}
      featuredAsset={featuredAsset}
      featuredPairing={featuredPairing}
    >
      <MemoryView
        asset={featuredAsset}
        agent={agent}
        cycles={agentCycles}
        memory={memory}
        comparison={memoryComparison}
      />
    </AppShell>
  );
}
