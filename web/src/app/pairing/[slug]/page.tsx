"use client";

import { notFound } from "next/navigation";
import { use, useMemo } from "react";

import { AppShell } from "@/components/app/AppShell";
import { AlternativePairings } from "@/components/pairing/AlternativePairings";
import { PairingDetailHeader } from "@/components/pairing/PairingDetailHeader";
import { PairingFactorAnalysis } from "@/components/pairing/PairingFactorAnalysis";
import { PairingFactorInspector } from "@/components/pairing/PairingFactorInspector";
import { PairingHistory } from "@/components/pairing/PairingHistory";
import { PairingLifecycleDetail } from "@/components/pairing/PairingLifecycleDetail";
import { PairingNextAction } from "@/components/pairing/PairingNextAction";
import { PairingThesis } from "@/components/pairing/PairingThesis";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { adaptPairingResponse, usePairing, usePairings, useProtocolState } from "@/lib/api/hooks";
import { pairingSlug } from "@/lib/api/adapters";
import { isJevoDemoMode } from "@/lib/api/client";

interface PairingDetailPageProps { params: Promise<{ slug: string }>; }

export default function PairingDetailPage({ params }: PairingDetailPageProps) {
  const { slug } = use(params);
  const normalizedSlug = slug.trim().toLowerCase();
  const demo = isJevoDemoMode();
  const state = useProtocolState();
  const pairingsQuery = usePairings();
  const pairingRef = useMemo(() => pairingsQuery.data?.data.find((item) => pairingSlug(item.symbol, item.memeSymbol) === normalizedSlug), [normalizedSlug, pairingsQuery.data]);
  const pairingQuery = usePairing(pairingRef?.id ?? "");

  if (state.isLoading || (!demo && (pairingsQuery.isPending || (Boolean(pairingRef) && pairingQuery.isPending)))) return <QueryLoadingState title="Loading pairing detail" />;
  if (state.isError || (!demo && (pairingsQuery.isError || pairingQuery.isError))) return <QueryErrorState title={`Failed to Load Pairing (${normalizedSlug})`} error={pairingQuery.error ?? pairingsQuery.error ?? state.error} onRetry={() => { void state.refetch(); void pairingsQuery.refetch(); void pairingQuery.refetch(); }} />;
  if (!state.data) return <QueryEmptyState title="No canonical pairing context" message="The worker has not published enough state to resolve this pairing." />;

  const pairing = pairingQuery.data?.data ? adaptPairingResponse(pairingQuery.data.data) : state.data.pairings.find((item) => item.slug === normalizedSlug);
  if (!pairing) notFound();
  const stock = state.data.assets.find((candidate) => candidate.symbol === pairing.stockSymbol);
  if (!stock) notFound();

  return (
    <AppShell
      {...state.data}
      activeSection="pairings"
      breadcrumb={
        <div className="crumbs">
          JEVO <span>/</span> PAIRING <span>/</span> <b>{pairing.stockSymbol} × {pairing.symbol}</b>
        </div>
      }
    >
      <div className="pairing-workspace">
        <PairingDetailHeader pairing={pairing} stock={stock} agent={state.data.agent} />
        <div className="pairing-workspace-content">
          <div className="pairing-detail-layout">
            <div className="pairing-detail-main">
              <PairingThesis pairing={pairing} />
              <PairingFactorAnalysis pairing={pairing} />
              <PairingFactorInspector pairing={pairing} stock={stock} agent={state.data.agent} />
              <AlternativePairings pairing={pairing} />
              <PairingHistory pairing={pairing} agent={state.data.agent} />
            </div>
            <aside aria-label="Pairing state and next action" className="pairing-detail-rail">
              <PairingLifecycleDetail pairing={pairing} />
              <PairingNextAction pairing={pairing} />
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
