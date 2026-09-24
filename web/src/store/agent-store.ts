import { create } from "zustand";

import type { Pairing } from "@/types/pairing";

type PairingFilter = "ALL" | Pairing["status"];
type MemoryFilter = "ALL" | "OBSERVE" | "SIGNAL" | "JEV_DECISION" | "PAIRING" | "LAUNCH" | "MEMORY" | "POLICY" | "ACTION";
type AdminPanel = "OVERVIEW" | "JEV_DECISIONS" | "PAIRING_REVIEW" | "LAUNCH_QUEUE" | "PROVIDERS" | "WALLET_CONTRACTS" | "AUDIT_LOG";

interface AgentInteractionState {
  selectedAssetSymbol: string | null;
  selectedPairingSlug: string | null;
  selectedSignalId: string | null;
  selectedMemoryEventId: string | null;
  activeAdminPanel: AdminPanel;
  pairingFilter: PairingFilter;
  memoryFilter: MemoryFilter;
  pairingSearch: string;
  memorySearch: string;
  setSelectedAssetSymbol: (symbol: string | null) => void;
  setSelectedPairingSlug: (slug: string | null) => void;
  setSelectedSignalId: (signalId: string | null) => void;
  setSelectedMemoryEventId: (eventId: string | null) => void;
  setActiveAdminPanel: (panel: AdminPanel) => void;
  setPairingFilter: (filter: PairingFilter) => void;
  setMemoryFilter: (filter: MemoryFilter) => void;
  setPairingSearch: (value: string) => void;
  setMemorySearch: (value: string) => void;
}

export const useAgentStore = create<AgentInteractionState>((set) => ({
  selectedAssetSymbol: "NVDA",
  selectedPairingSlug: "nvda-gpu",
  selectedSignalId: "nvda-narrative",
  selectedMemoryEventId: "MEM-9841-221",
  activeAdminPanel: "OVERVIEW",
  pairingFilter: "ALL",
  memoryFilter: "ALL",
  pairingSearch: "",
  memorySearch: "",
  setSelectedAssetSymbol: (selectedAssetSymbol) => set({ selectedAssetSymbol }),
  setSelectedPairingSlug: (selectedPairingSlug) => set({ selectedPairingSlug }),
  setSelectedSignalId: (selectedSignalId) => set({ selectedSignalId }),
  setSelectedMemoryEventId: (selectedMemoryEventId) => set({ selectedMemoryEventId }),
  setActiveAdminPanel: (activeAdminPanel) => set({ activeAdminPanel }),
  setPairingFilter: (pairingFilter) => set({ pairingFilter }),
  setMemoryFilter: (memoryFilter) => set({ memoryFilter }),
  setPairingSearch: (pairingSearch) => set({ pairingSearch }),
  setMemorySearch: (memorySearch) => set({ memorySearch }),
}));
