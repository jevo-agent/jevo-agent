import { LandingPage } from "@/components/landing/LandingPage";
import { mockAgentState } from "@/data/mock-agent-state";

export default function HomePage() {
  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const nvda = assets.find((asset) => asset.symbol === "NVDA");
  const nvdaGpu = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!nvda || !nvdaGpu) {
    throw new Error("The Home page requires the NVDA asset and its shared launch pairing.");
  }

  return <LandingPage agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={nvda} featuredPairing={nvdaGpu} />;
}
