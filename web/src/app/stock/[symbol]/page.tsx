import { notFound } from "next/navigation";

import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { AgentMemory } from "@/components/stock/AgentMemory";
import { DecisionSummary } from "@/components/stock/DecisionSummary";
import { DecisionTrace } from "@/components/stock/DecisionTrace";
import { JevEvaluation } from "@/components/stock/JevEvaluation";
import { PairingOpportunities } from "@/components/stock/PairingOpportunities";
import { SignalInspector } from "@/components/stock/SignalInspector";
import { StockHeader } from "@/components/stock/StockHeader";
import { mockAgentState } from "@/data/mock-agent-state";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: StockPageProps) {
  const { symbol } = await params;
  const normalizedSymbol = symbol.trim().toUpperCase();
  const { agent, assets, pairings } = mockAgentState;
  const asset = assets.find((candidate) => candidate.symbol === normalizedSymbol);

  if (!asset) {
    notFound();
  }

  const primaryPairing = pairings.find((pairing) => pairing.stockSymbol === asset.symbol);

  return (
    <div className="stock-detail-root">
      <AgentStatusBar
        agentStatus={agent.status}
        jevStatus={agent.jevStatus}
        currentOperation={agent.currentOperation}
        lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds}
        nextCycleInSeconds={agent.nextCycleInSeconds}
        networkLabel={agent.networkLabel}
      />
      <StockHeader asset={asset} agent={agent} />
      <main className="protocol-shell py-8 sm:py-10">
        <div className="grid border border-[var(--jevo-line)] lg:grid-cols-[minmax(0,1.28fr)_minmax(300px,0.72fr)]">
          <div>
            <DecisionSummary asset={asset} agent={agent} />
            <JevEvaluation asset={asset} />
          </div>
          <aside className="border-t border-[var(--jevo-line)] lg:border-t-0 lg:border-l">
            <SignalInspector asset={asset} />
            <PairingOpportunities asset={asset} pairing={primaryPairing} />
          </aside>
        </div>

        <div className="mt-8 border border-[var(--jevo-line)]">
          <DecisionTrace asset={asset} cycle={agent.activeCycle} />
          <AgentMemory asset={asset} />
        </div>
      </main>
    </div>
  );
}
