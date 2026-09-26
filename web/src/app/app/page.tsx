"use client";

import { AppShell } from "@/components/app/AppShell";
import { OverviewView } from "@/components/app/views/OverviewView";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useOpportunities, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

export default function AppPage() {
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
    agentQuery.error ||
    oppsQuery.error ||
    pairingsQuery.error ||
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
        title="Failed to Load Agent Overview"
        error={error}
        onRetry={handleRefetch}
      />
    );
  }

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!featuredAsset || !featuredPairing) {
    throw new Error("The JEVO app requires the shared NVDA opportunity and launch pairing.");
  }

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
      <OverviewView
        agent={agent}
        assets={assets}
        ranking={ranking}
        pairings={pairings}
        launch={launch}
        memory={memory}
        featuredPairing={featuredPairing}
      />
    </AppShell>
  );
}
