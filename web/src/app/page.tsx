"use client";

import { LandingPage } from "@/components/landing/LandingPage";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";

export default function HomePage() {
  const state = useProtocolState();
  if (state.isLoading) return <QueryLoadingState title="Loading JEVO state" />;
  if (state.isError) return <QueryErrorState title="Failed to Load Market Intelligence" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data || !state.data.launch || !state.data.featuredPairing) return <QueryEmptyState title="No canonical market state" message="The worker has not published a complete JEVO state yet." />;
  const { launch, featuredPairing } = state.data;
  return <LandingPage {...state.data} launch={launch} featuredPairing={featuredPairing} />;
}
