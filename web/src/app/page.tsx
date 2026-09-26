"use client";

import { LandingPage } from "@/components/landing/LandingPage";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { mockAgentState } from "@/data/mock-agent-state";
import { useOpportunities, useAgentStatus, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

export default function HomePage() {
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--jevo-bg,#0b0d0b)]">
        <QueryErrorState
          title="Failed to Load Market Intelligence"
          error={error}
          onRetry={handleRefetch}
        />
      </div>
    );
  }

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const nvda = assets.find((asset) => asset.symbol === "NVDA");
  const nvdaGpu = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!nvda || !nvdaGpu) {
    throw new Error("The Home page requires the NVDA asset and its shared launch pairing.");
  }

  return (
    <LandingPage
      agent={agent}
      assets={assets}
      ranking={ranking}
      pairings={pairings}
      launch={launch}
      memory={memory}
      featuredAsset={nvda}
      featuredPairing={nvdaGpu}
    />
  );
}
