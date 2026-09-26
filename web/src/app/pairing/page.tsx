"use client";

import { AppShell } from "@/components/app/AppShell";
import { PairingsView } from "@/components/app/views/PairingsView";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function PairingMarketplacePage() {
  const state = useProtocolState();
  if (state.isLoading) return <QueryLoadingState title="Loading pairing state" />;
  if (state.isError) return <QueryErrorState title="Failed to Load Pairings" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data) return <QueryEmptyState title="No canonical pairing state" message="The worker has not published a pairing candidate and launch context yet." />;
  return (
    <AppShell {...state.data}>
      <PairingsView pairings={state.data.pairings} />
    </AppShell>
  );
}
