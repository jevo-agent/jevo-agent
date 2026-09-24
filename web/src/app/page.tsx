import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { AgentTerminal } from "@/components/home/AgentTerminal";
import { HeroSection } from "@/components/home/HeroSection";
import { JevDecisionEngine } from "@/components/home/JevDecisionEngine";
import { JevLoreSection } from "@/components/home/JevLoreSection";
import { LaunchCandidatePreview } from "@/components/home/LaunchCandidatePreview";
import { MemoryPreview } from "@/components/home/MemoryPreview";
import { OpportunityRanking } from "@/components/home/OpportunityRanking";
import { PairingIntelligence } from "@/components/home/PairingIntelligence";
import { mockAgentState } from "@/data/mock-agent-state";

export default function HomePage() {
  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const nvda = assets.find((asset) => asset.symbol === "NVDA");
  const nvdaGpu = pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug);

  if (!nvda || !nvdaGpu) {
    throw new Error("The Home page requires the NVDA asset and its shared launch pairing.");
  }

  return (
    <>
      <AgentStatusBar
        agentStatus={agent.status}
        jevStatus={agent.jevStatus}
        currentOperation={agent.currentOperation}
        lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds}
        nextCycleInSeconds={agent.nextCycleInSeconds}
        networkLabel={agent.networkLabel}
      />
      <HeroSection agent={agent} featuredAsset={nvda} />
      <AgentTerminal agent={agent} />
      <OpportunityRanking assets={assets} rankedSymbols={ranking} cycle={agent.activeCycle} />
      <JevDecisionEngine asset={nvda} cycle={agent.activeCycle} />
      <PairingIntelligence pairing={nvdaGpu} />
      <JevLoreSection />
      <LaunchCandidatePreview launch={launch} pairing={nvdaGpu} />
      <MemoryPreview asset={nvda} memory={memory} />
      <footer className="border-t border-[var(--jevo-line)]">
        <div className="protocol-shell flex flex-col justify-between gap-4 py-8 font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase sm:flex-row">
          <span>JEVO / Autonomous market intelligence powered by Jev</span>
          <span>Internal opportunity signals, not investment-return predictions.</span>
        </div>
      </footer>
    </>
  );
}
