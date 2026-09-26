"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { AppShell } from "@/components/app/AppShell";
import { AgentMemory } from "@/components/stock/AgentMemory";
import { DecisionSummary } from "@/components/stock/DecisionSummary";
import { DecisionTrace } from "@/components/stock/DecisionTrace";
import { JevEvaluation } from "@/components/stock/JevEvaluation";
import { PairingOpportunities } from "@/components/stock/PairingOpportunities";
import { SignalInspector } from "@/components/stock/SignalInspector";
import { StockHeader } from "@/components/stock/StockHeader";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useAdaptedStock, useProtocolState } from "@/lib/api/hooks";

interface StockPageProps { params: Promise<{ symbol: string }>; }

export default function StockDetailPage({ params }: StockPageProps) {
  const { symbol } = use(params);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const state = useProtocolState();
  const stockState = useAdaptedStock(normalizedSymbol);

  if (state.isLoading || stockState.isLoading) return <QueryLoadingState title={`Loading ${normalizedSymbol} workspace`} />;
  if (state.isError || stockState.isError) return <QueryErrorState title={`Failed to Load Stock Data (${normalizedSymbol})`} error={stockState.error ?? state.error} onRetry={() => { void state.refetch(); void stockState.refetch(); }} />;
  if (!state.data || !stockState.data?.data) return <QueryEmptyState title={`No canonical ${normalizedSymbol} state`} message="The worker has not published this asset in its current ranking state." />;

  const asset = stockState.data.data;
  if (!asset) notFound();
  const primaryPairing = state.data.pairings.find((pairing) => pairing.stockSymbol === asset.symbol);
  return (
    <AppShell {...state.data} activeSection="opportunities" breadcrumb={<div className="crumbs">JEVO <span>/</span> OPPORTUNITY <span>/</span> <b>{asset.symbol}</b></div>}>
      <div className="stock-workspace">
        <StockHeader asset={asset} agent={state.data.agent} />
        <div className="stock-workspace-content py-6 sm:py-8">
          <div className="grid border border-[var(--jevo-line)] lg:grid-cols-[minmax(0,1.28fr)_minmax(300px,0.72fr)]">
            <div>
              <DecisionSummary asset={asset} agent={state.data.agent} />
              <JevEvaluation asset={asset} />
            </div>
            <aside className="border-t border-[var(--jevo-line)] lg:border-t-0 lg:border-l">
              <SignalInspector asset={asset} />
              <PairingOpportunities asset={asset} pairing={primaryPairing} />
            </aside>
          </div>
          <div className="mt-8 border border-[var(--jevo-line)]">
            <DecisionTrace asset={asset} cycle={state.data.agent.activeCycle ?? "UNAVAILABLE"} />
            <AgentMemory asset={asset} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
