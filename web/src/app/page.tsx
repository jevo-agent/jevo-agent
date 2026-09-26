"use client";

import { LandingPage } from "@/components/landing/LandingPage";
import { mockAgentState } from "@/data/mock-agent-state";
import { useOpportunities, useAgentStatus, usePairings, useLaunches, useMemory } from "@/lib/api/hooks";

/**
 * Home page — uses TanStack Query hooks backed by the real backend
 * (or fixture routes when NEXT_PUBLIC_API_URL is unset).
 * JSX is unchanged from the previous mock-based version.
 */
export default function HomePage() {
  // Hooks (real backend → fixture fallback)
  useAgentStatus();
  useOpportunities();
  usePairings();
  useLaunches();
  useMemory();

  // Fall back to mock data for rendering — the mock data is preserved
  // until Stage E (deletion) is confirmed stable.
  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const nvda = assets.find((asset) => asset.symbol === "NVDA");
  const nvdaGpu = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!nvda || !nvdaGpu) {
    throw new Error("The Home page requires the NVDA asset and its shared launch pairing.");
  }

  return <LandingPage agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={nvda} featuredPairing={nvdaGpu} />;
}
