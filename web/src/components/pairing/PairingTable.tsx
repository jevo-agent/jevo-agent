"use client";

import { PairingRow } from "@/components/pairing/PairingRow";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingTableProps {
  pairings: Pairing[];
  assets: Stock[];
  selectedPairingSlug: string | undefined;
  onSelect: (slug: string) => void;
}

export function PairingTable({ pairings, assets, selectedPairingSlug, onSelect }: PairingTableProps) {
  const sortedPairings = [...pairings].sort((left, right) => right.pairScore - left.pairScore);

  if (sortedPairings.length === 0) {
    return <div className="border-b border-[var(--jevo-line)] p-8"><p className="protocol-label">No matching pairings</p><p className="mt-3 text-[var(--jevo-muted)]">Change the search or status filter to inspect the current protocol state.</p></div>;
  }

  return (
    <div>
      <div className="hidden grid-cols-[36px_minmax(0,1.1fr)_minmax(150px,0.8fr)_58px_128px_minmax(130px,0.8fr)] gap-4 border-b border-[var(--jevo-line)] px-4 py-3 font-mono text-[0.6rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase md:grid"><span>#</span><span>Pair</span><span>Stock opportunity</span><span>Score</span><span>Status</span><span>Why now</span></div>
      <ol className="m-0 list-none p-0">{sortedPairings.map((pairing, index) => {
        const stock = assets.find((asset) => asset.symbol === pairing.stockSymbol);
        if (!stock) return null;
        return <PairingRow key={pairing.slug} pairing={pairing} stock={stock} index={index} selected={pairing.slug === selectedPairingSlug} onSelect={onSelect} />;
      })}</ol>
    </div>
  );
}
