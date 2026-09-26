"use client";

import { AppShell } from "@/components/app/AppShell";
import { OverviewView } from "@/components/app/views/OverviewView";
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useOpportunities, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

export default function AppPage() {
  // Register hooks so TanStack Query cache stays warm and
  // EventSourceProvider invalidations trigger re-renders.
  useAgentStatus();
  useOpportunities();
  usePairings();
  useLaunches();
  useMemory();

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!featuredAsset || !featuredPairing) {
    throw new Error("The JEVO app requires the shared NVDA opportunity and launch pairing.");
  }

  return <AppShell agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={featuredAsset} featuredPairing={featuredPairing}><OverviewView agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredPairing={featuredPairing} /></AppShell>;
}
