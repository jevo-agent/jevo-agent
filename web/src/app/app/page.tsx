"use client";

import { AppShell } from "@/components/app/AppShell";
import { OverviewView } from "@/components/app/views/OverviewView";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function AppPage() {
  const state = useProtocolState();

  if (state.isLoading) return <QueryLoadingState title="Loading operational overview" />;
  if (state.isError) return <QueryErrorState title="Failed to Load Agent Overview" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data) return <QueryEmptyState title="No canonical opportunity state" message="The worker has not published a ranked opportunity state yet." />;

  const { agent, assets, ranking, pairings, launch, memory, featuredPairing } = state.data;
  return (
    <AppShell {...state.data}>
      <OverviewView agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredPairing={featuredPairing} />
    </AppShell>
  );
}
