import { AppShell } from "@/components/app/AppShell";
import { MemoryView } from "@/components/app/views/MemoryView";
import { mockAgentState } from "@/data/mock-agent-state";

export default function AgentMemoryPage() {
  const { agent, agentCycles, assets, ranking, pairings, launch, memory, memoryComparison } = mockAgentState;
  const featuredAsset = assets.find((asset) => asset.symbol === "NVDA");
  const featuredPairing = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);
  if (!featuredAsset || !featuredPairing) throw new Error("The Memory view requires the shared NVDA opportunity and launch pairing.");

  return <AppShell agent={agent} assets={assets} ranking={ranking} pairings={pairings} launch={launch} memory={memory} featuredAsset={featuredAsset} featuredPairing={featuredPairing}><MemoryView asset={featuredAsset} agent={agent} cycles={agentCycles} memory={memory} comparison={memoryComparison} /></AppShell>;
}
