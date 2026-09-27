"use client";

import { notFound } from "next/navigation";
import { use, useMemo } from "react";

import { AppShell } from "@/components/app/AppShell";
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
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { adaptLaunch, pairingSlug } from "@/lib/api/adapters";
import { useLaunch, useLaunches, useProtocolState } from "@/lib/api/hooks";
import { isJevoDemoMode } from "@/lib/api/client";

interface LaunchDetailPageProps { params: Promise<{ slug: string }>; }

export default function LaunchDetailPage({ params }: LaunchDetailPageProps) {
  const { slug } = use(params);
  const normalizedSlug = slug.trim().toLowerCase();
  const demo = isJevoDemoMode();
  const state = useProtocolState();
  const launchesQuery = useLaunches();
  const launchRef = useMemo(() => launchesQuery.data?.data.find((candidate) => {
    if (candidate.selectedPairingSlug?.toLowerCase() === normalizedSlug) return true;
    if (candidate.pairingCandidateId?.toLowerCase() === normalizedSlug) return true;
    const pairing = state.data?.pairings.find((item) => pairingSlug(item.stockSymbol, item.symbol) === normalizedSlug);
    return pairing && candidate.pairingCandidateId === pairing.slug;
  }), [launchesQuery.data, normalizedSlug, state.data?.pairings]);
  const launchId = launchRef?.id ?? launchRef?.cycleId ?? launchRef?.pairingCandidateId ?? "";
  const launchQuery = useLaunch(launchId);

  if (state.isLoading || (!demo && (launchesQuery.isPending || (Boolean(launchId) && launchQuery.isPending)))) return <QueryLoadingState title="Loading launch detail" />;
  if (state.isError || (!demo && (launchesQuery.isError || launchQuery.isError))) return <QueryErrorState title={`Failed to Load Launch (${normalizedSlug})`} error={launchQuery.error ?? launchesQuery.error ?? state.error} onRetry={() => { void state.refetch(); void launchesQuery.refetch(); void launchQuery.refetch(); }} />;
  const protocolData = state.data;
  if (!protocolData || (!launchRef && !demo)) return <QueryEmptyState title="No canonical launch state" message="The worker has not published a launch candidate for this route." />;

  const pairing = protocolData.pairings.find((candidate) => candidate.slug === (launchRef?.selectedPairingSlug ?? protocolData.launch?.selectedPairingSlug) || candidate.slug === launchRef?.pairingCandidateId || pairingSlug(candidate.stockSymbol, candidate.symbol) === normalizedSlug);
  const launch = demo ? protocolData.launch : (launchQuery.data?.data || launchRef ? adaptLaunch(launchQuery.data?.data ?? launchRef!) : null);
  if (!pairing || !launch) notFound();
  const stock = protocolData.assets.find((candidate) => candidate.symbol === pairing.stockSymbol);
  if (!stock) notFound();

  return (
    <AppShell
      {...protocolData}
      activeSection="launch"
      breadcrumb={
        <div className="crumbs">
          JEVO <span>/</span> LAUNCH <span>/</span> <b>{pairing.stockSymbol} × {pairing.symbol}</b>
        </div>
      }
    >
      <div className="launch-workspace">
        <LaunchHeader launch={launch} pairing={pairing} stock={stock} agent={protocolData.agent} />
        <div className="launch-workspace-content py-6 sm:py-8">
          <div className="grid overflow-hidden border border-[var(--jevo-line)] xl:grid-cols-[minmax(0,1fr)_23rem]">
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
