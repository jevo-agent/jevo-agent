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
  if (!state.data) return <QueryEmptyState title="No canonical launch context" message="The worker has not published an opportunity state for this workspace." />;
  return (
    <AppShell {...state.data}>
      <LaunchView
        launch={state.data.launch}
        pairing={state.data.featuredPairing}
        agent={state.data.agent}
      />
    </AppShell>
  );
}
