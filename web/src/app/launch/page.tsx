import { AppShell } from "@/components/app/AppShell";
import { LaunchView } from "@/components/app/views/LaunchView";
import { mockAgentState } from "@/data/mock-agent-state";

export default function LaunchPage() {
  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const pairing = pairings.find((candidate) => candidate.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !pairing) throw new Error("The Launch view requires the shared launch pairing.");

  return <AppShell agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={featuredAsset} featuredPairing={pairing}><LaunchView launch={launch} pairing={pairing} /></AppShell>;
}
