"use client";

import { AppShell } from "@/components/app/AppShell";
import { ContractsView } from "@/components/app/views/ContractsView";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function ContractsPage() {
  const state = useProtocolState();

  if (state.isLoading) return <QueryLoadingState title="Loading contracts context" />;
  if (state.isError) {
    return (
      <QueryErrorState
        title="Failed to Load Contracts Context"
        error={state.error}
        onRetry={() => void state.refetch()}
      />
    );
  }
  if (!state.data) {
    return (
      <QueryEmptyState
        title="No canonical state"
        message="The worker has not published an active cycle context for this workspace."
      />
    );
  }

  return (
    <AppShell
      {...state.data}
      activeSection="contracts"
      breadcrumb={
        <div className="crumbs">
          JEVO <span>/</span> <b>CONTRACTS</b>
        </div>
      }
    >
      <ContractsView />
    </AppShell>
  );
}
