import { notFound } from "next/navigation";

import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { AgentWalletState } from "@/components/launch/AgentWalletState";
import { ContractState } from "@/components/launch/ContractState";
import { LaunchActivity } from "@/components/launch/LaunchActivity";
import { LaunchCountdown } from "@/components/launch/LaunchCountdown";
import { LaunchCycle } from "@/components/launch/LaunchCycle";
import { LaunchHeader } from "@/components/launch/LaunchHeader";
import { LaunchSelectionThesis } from "@/components/launch/LaunchSelectionThesis";
import { LaunchStageInspector } from "@/components/launch/LaunchStageInspector";
import { PolicyCheckList } from "@/components/launch/PolicyCheckList";
import { TokenSpecification } from "@/components/launch/TokenSpecification";
import { TransactionState } from "@/components/launch/TransactionState";
import { mockAgentState } from "@/data/mock-agent-state";

interface LaunchDetailPageProps { params: Promise<{ slug: string }>; }

export default async function LaunchDetailPage({ params }: LaunchDetailPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  const { agent, assets, launch, pairings } = mockAgentState;
  const pairing = pairings.find((candidate) => candidate.slug === normalizedSlug);

  if (!pairing || pairing.slug !== launch.selectedPairingSlug) notFound();

  const stock = assets.find((candidate) => candidate.symbol === pairing.stockSymbol);
  if (!stock) notFound();

  return <><AgentStatusBar agentStatus={agent.status} jevStatus={agent.jevStatus} currentOperation={agent.currentOperation} lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds} nextCycleInSeconds={agent.nextCycleInSeconds} networkLabel={agent.networkLabel} /><LaunchHeader launch={launch} pairing={pairing} stock={stock} agent={agent} /><main className="protocol-shell py-8 sm:py-10"><div className="grid overflow-hidden border border-[var(--jevo-line)] xl:grid-cols-[minmax(0,1fr)_23rem]">
    <div className="xl:col-start-1"><LaunchSelectionThesis launch={launch} pairing={pairing} stock={stock} /></div>
    <div className="xl:col-start-1"><LaunchCountdown launch={launch} pairing={pairing} /></div>
    <div className="xl:col-start-1"><LaunchCycle launch={launch} /></div>
    <aside aria-label="Selected launch stage" className="xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:border-l xl:border-[var(--jevo-line)] xl:bg-[rgb(13_16_13_/_72%)]"><LaunchStageInspector launch={launch} pairing={pairing} /></aside>
    <div className="xl:col-start-1"><PolicyCheckList launch={launch} /></div>
    <div className="xl:col-start-1"><LaunchActivity launch={launch} /></div>
    <div className="xl:col-start-1"><TokenSpecification launch={launch} /></div>
    <aside aria-label="Agent wallet state" className="xl:col-start-2 xl:row-start-3 xl:border-l xl:border-[var(--jevo-line)] xl:bg-[rgb(13_16_13_/_72%)]"><AgentWalletState launch={launch} /></aside>
    <aside aria-label="Contract reference state" className="xl:col-start-2 xl:row-start-4 xl:border-l xl:border-[var(--jevo-line)] xl:bg-[rgb(13_16_13_/_72%)]"><ContractState launch={launch} /></aside>
    <aside aria-label="Transaction status" className="xl:col-start-2 xl:row-start-5 xl:border-l xl:border-[var(--jevo-line)] xl:bg-[rgb(13_16_13_/_72%)]"><TransactionState launch={launch} pairing={pairing} /></aside>
  </div></main></>;
}
