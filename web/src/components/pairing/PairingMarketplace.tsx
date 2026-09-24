"use client";

import { useEffect, useMemo } from "react";

import { PairingFilters } from "@/components/pairing/PairingFilters";
import { PairingInspector } from "@/components/pairing/PairingInspector";
import { PairingTable } from "@/components/pairing/PairingTable";
import { useAgentStore } from "@/store/agent-store";
import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingMarketplaceProps {
  agent: AgentRuntime;
  pairings: Pairing[];
  assets: Stock[];
}

export function PairingMarketplace({ agent, pairings, assets }: PairingMarketplaceProps) {
  const selectedPairingSlug = useAgentStore((state) => state.selectedPairingSlug);
  const pairingFilter = useAgentStore((state) => state.pairingFilter);
  const pairingSearch = useAgentStore((state) => state.pairingSearch);
  const setSelectedPairingSlug = useAgentStore((state) => state.setSelectedPairingSlug);

  const filteredPairings = useMemo(() => {
    const query = pairingSearch.trim().toLowerCase();
    return pairings.filter((pairing) => {
      const matchesFilter = pairingFilter === "ALL" || pairing.status === pairingFilter;
      const searchable = [pairing.stockSymbol, pairing.memeName, pairing.symbol, pairing.thesis.core, pairing.thesis.whyNow].join(" ").toLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [pairingFilter, pairingSearch, pairings]);

  const selectedPairing = filteredPairings.find((pairing) => pairing.slug === selectedPairingSlug) ?? filteredPairings[0];
  const selectedStock = assets.find((asset) => asset.symbol === selectedPairing?.stockSymbol);

  useEffect(() => {
    if (selectedPairing && selectedPairing.slug !== selectedPairingSlug) {
      setSelectedPairingSlug(selectedPairing.slug);
    }
  }, [selectedPairing, selectedPairingSlug, setSelectedPairingSlug]);

  return (
    <>
      <PairingFilters />
      <section className="protocol-shell py-8 sm:py-10" aria-label="Pairing marketplace workspace">
        <div className="grid border border-[var(--jevo-line)] lg:grid-cols-[minmax(0,1.25fr)_minmax(350px,0.75fr)]">
          <PairingTable pairings={filteredPairings} assets={assets} selectedPairingSlug={selectedPairing?.slug} onSelect={setSelectedPairingSlug} />
          <div className="border-t border-[var(--jevo-line)] lg:border-t-0 lg:border-l"><PairingInspector pairing={selectedPairing} stock={selectedStock} agent={agent} /></div>
        </div>
      </section>
    </>
  );
}
