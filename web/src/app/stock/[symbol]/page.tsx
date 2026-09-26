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
import { mockAgentState } from "@/data/mock-agent-state";
import { useAgentStatus, useStock, usePairings } from "@/lib/api/hooks";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockPageProps) {
  const { symbol } = use(params);
  const normalizedSymbol = symbol.trim().toUpperCase();

  // Register query hooks — primes the cache from the real backend or fixtures
  useAgentStatus();
  useStock(normalizedSymbol);
  usePairings();

  const { agent, assets, ranking, pairings, launch, memory } = mockAgentState;
  const asset = assets.find((candidate) => candidate.symbol === normalizedSymbol);

  if (!asset) {
    notFound();
  }

  const primaryPairing = pairings.find((pairing) => pairing.stockSymbol === asset.symbol);
  const featuredAsset = asset;
  const featuredPairing = pairings.find((p) => p.slug === launch.selectedPairingSlug) ?? pairings[0];

  return (
    <AppShell
      agent={agent}
      assets={assets}
      ranking={ranking}
      pairings={pairings}
      launch={launch}
      memory={memory}
      featuredAsset={featuredAsset}
      featuredPairing={featuredPairing}
      activeSection="opportunities"
      breadcrumb={
        <div className="crumbs">
          JEVO <span>/</span> OPPORTUNITY <span>/</span> <b>{asset.symbol}</b>
        </div>
      }
    >
      <div className="stock-workspace">
        <StockHeader asset={asset} agent={agent} />
        <div className="stock-workspace-content py-6 sm:py-8">
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
        </div>
      </div>
    </AppShell>
  );
}
