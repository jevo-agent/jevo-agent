"use client";

import { AppShell } from "@/components/app/AppShell";
import { PairingsView } from "@/components/app/views/PairingsView";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useOpportunities, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

export default function PairingMarketplacePage() {
  const agentQuery = useAgentStatus();
  const oppsQuery = useOpportunities();
  const pairingsQuery = usePairings();
  const launchesQuery = useLaunches();
  const memoryQuery = useMemory();

  const isError =
    agentQuery.isError ||
    oppsQuery.isError ||
    pairingsQuery.isError ||
    launchesQuery.isError ||
    memoryQuery.isError;

  const error =
    pairingsQuery.error ||
    agentQuery.error ||
    oppsQuery.error ||
    launchesQuery.error ||
    memoryQuery.error;

  const handleRefetch = () => {
    void agentQuery.refetch();
    void oppsQuery.refetch();
    void pairingsQuery.refetch();
    void launchesQuery.refetch();
    void memoryQuery.refetch();
  };

  if (isError) {
    return (
      <QueryErrorState
        title="Failed to Load Pairings"
        error={error}
        onRetry={handleRefetch}
      />
    );
  }

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !featuredPairing) throw new Error("The Pairings view requires the shared NVDA opportunity and launch pairing.");

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
      <PairingsView pairings={pairings} />
    </AppShell>
  );
}
