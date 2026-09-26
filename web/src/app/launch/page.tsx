"use client";

import { AppShell } from "@/components/app/AppShell";
import { LaunchView } from "@/components/app/views/LaunchView";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useOpportunities, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

export default function LaunchPage() {
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
    launchesQuery.error ||
    agentQuery.error ||
    oppsQuery.error ||
    pairingsQuery.error ||
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
        title="Failed to Load Launches"
        error={error}
        onRetry={handleRefetch}
      />
    );
  }

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const pairing = pairings.find((candidate) => candidate.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !pairing) throw new Error("The Launch view requires the shared launch pairing.");

  return (
    <AppShell
      agent={agent}
      assets={assets}
      ranking={ranking}
      pairings={pairings}
      launch={launch}
      memory={memory}
      featuredAsset={featuredAsset}
      featuredPairing={pairing}
    >
      <LaunchView launch={launch} pairing={pairing} />
    </AppShell>
  );
}
