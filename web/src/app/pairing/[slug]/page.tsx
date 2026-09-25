import { notFound } from "next/navigation";

import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { AlternativePairings } from "@/components/pairing/AlternativePairings";
import { PairingDetailHeader } from "@/components/pairing/PairingDetailHeader";
import { PairingFactorAnalysis } from "@/components/pairing/PairingFactorAnalysis";
import { PairingFactorInspector } from "@/components/pairing/PairingFactorInspector";
import { PairingHistory } from "@/components/pairing/PairingHistory";
import { PairingLifecycleDetail } from "@/components/pairing/PairingLifecycleDetail";
import { PairingNextAction } from "@/components/pairing/PairingNextAction";
import { PairingThesis } from "@/components/pairing/PairingThesis";
import { mockAgentState } from "@/data/mock-agent-state";

interface PairingDetailPageProps { params: Promise<{ slug: string }>; }

export default async function PairingDetailPage({ params }: PairingDetailPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  const { agent, assets, pairings } = mockAgentState;
  const pairing = pairings.find((candidate) => candidate.slug === normalizedSlug);

  if (!pairing) notFound();

  const stock = assets.find((candidate) => candidate.symbol === pairing.stockSymbol);
  if (!stock) notFound();

  return (
    <>
      <AgentStatusBar agentStatus={agent.status} jevStatus={agent.jevStatus} currentOperation={agent.currentOperation} lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds} nextCycleInSeconds={agent.nextCycleInSeconds} networkLabel={agent.networkLabel} />
      <PairingDetailHeader pairing={pairing} stock={stock} agent={agent} />
      <main className="protocol-shell py-8 sm:py-10">
        <div className="grid border border-[var(--jevo-line)] xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0">
            <PairingThesis pairing={pairing} />
            <PairingFactorAnalysis pairing={pairing} />
            <PairingFactorInspector pairing={pairing} stock={stock} agent={agent} />
            <AlternativePairings pairing={pairing} />
            <PairingHistory pairing={pairing} agent={agent} />
          </div>
          <aside aria-label="Pairing state and next action" className="border-t border-[var(--jevo-line)] bg-[rgb(13_16_13_/_72%)] xl:border-t-0 xl:border-l xl:sticky xl:top-14">
            <PairingLifecycleDetail pairing={pairing} />
            <PairingNextAction pairing={pairing} />
          </aside>
        </div>
      </main>
    </>
  );
}
