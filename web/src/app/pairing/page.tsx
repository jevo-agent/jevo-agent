import { AppShell } from "@/components/app/AppShell";
import { PairingsView } from "@/components/app/views/PairingsView";
import { mockAgentState } from "@/data/mock-agent-state";

export default function PairingMarketplacePage() {
  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !featuredPairing) throw new Error("The Pairings view requires the shared NVDA opportunity and launch pairing.");

  return <AppShell agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={featuredAsset} featuredPairing={featuredPairing}><PairingsView pairings={pairings} /></AppShell>;
}
