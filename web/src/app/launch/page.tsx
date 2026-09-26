"use client";

import { AppShell } from "@/components/app/AppShell";
import { LaunchView } from "@/components/app/views/LaunchView";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function LaunchPage() {
  const state = useProtocolState();
  if (state.isLoading) return <QueryLoadingState title="Loading launch state" />;
  if (state.isError) return <QueryErrorState title="Failed to Load Launches" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data || !state.data.launch || !state.data.featuredPairing) return <QueryEmptyState title="No canonical launch state" message="The worker has not published a launch candidate for the current pairing state." />;
  return (
    <AppShell {...state.data}>
      <LaunchView launch={state.data.launch} pairing={state.data.featuredPairing} />
    </AppShell>
  );
}
