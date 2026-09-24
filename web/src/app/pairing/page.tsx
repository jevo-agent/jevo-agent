import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { PairingContext } from "@/components/pairing/PairingContext";
import { PairingMarketplace } from "@/components/pairing/PairingMarketplace";
import { PairingMarketplaceHeader } from "@/components/pairing/PairingMarketplaceHeader";
import { mockAgentState } from "@/data/mock-agent-state";

export default function PairingMarketplacePage() {
  const { agent, pairings, assets } = mockAgentState;

  return (
    <>
      <AgentStatusBar agentStatus={agent.status} jevStatus={agent.jevStatus} currentOperation={agent.currentOperation} lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds} nextCycleInSeconds={agent.nextCycleInSeconds} networkLabel={agent.networkLabel} />
      <PairingMarketplaceHeader agent={agent} pairings={pairings} />
      <main>
        <PairingMarketplace agent={agent} pairings={pairings} assets={assets} />
        <PairingContext pairings={pairings} agent={agent} />
      </main>
    </>
  );
}
