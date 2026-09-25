import { create } from "zustand";

import type { Pairing } from "@/types/pairing";
import type { Launch } from "@/types/launch";

type PairingFilter = "ALL" | Pairing["status"];
type LaunchStage = Launch["stage"];
type PairingReviewOverride = "APPROVED" | "REJECTED" | "RETURNED_TO_REVIEW";
type AdminLaunchControl = "IDLE" | "SCHEDULED" | "PAUSED";
type MemoryFilter = "ALL" | "OBSERVE" | "SIGNAL" | "JEV_DECISION" | "PAIRING" | "LAUNCH" | "MEMORY" | "POLICY" | "ACTION";
type AdminPanel = "OVERVIEW" | "JEV_DECISIONS" | "PAIRING_REVIEW" | "LAUNCH_QUEUE" | "PROVIDERS" | "WALLET_CONTRACTS" | "AUDIT_LOG";

interface AgentInteractionState {
  selectedAssetSymbol: string | null;
  selectedPairingSlug: string | null;
  selectedPairingFactorId: string | null;
  selectedLaunchStageId: LaunchStage | null;
  selectedSignalId: string | null;
  selectedMemoryEventId: string | null;
  activeAdminPanel: AdminPanel;
  selectedAdminDecisionId: string | null;
  selectedAdminPairingSlug: string | null;
  adminPairingReviewOverrides: Record<string, PairingReviewOverride>;
  adminLaunchControl: AdminLaunchControl;
  adminControlNotice: string | null;
  pairingFilter: PairingFilter;
  memoryFilter: MemoryFilter;
  pairingSearch: string;
  memorySearch: string;
  setSelectedAssetSymbol: (symbol: string | null) => void;
  setSelectedPairingSlug: (slug: string | null) => void;
  setSelectedPairingFactorId: (factorId: string | null) => void;
  setSelectedLaunchStageId: (stageId: LaunchStage | null) => void;
  setSelectedSignalId: (signalId: string | null) => void;
  setSelectedMemoryEventId: (eventId: string | null) => void;
  setActiveAdminPanel: (panel: AdminPanel) => void;
  setSelectedAdminDecisionId: (id: string | null) => void;
  setSelectedAdminPairingSlug: (slug: string | null) => void;
  setAdminPairingReviewOverride: (slug: string, state: PairingReviewOverride) => void;
  setAdminLaunchControl: (state: AdminLaunchControl) => void;
  setAdminControlNotice: (notice: string | null) => void;
  setPairingFilter: (filter: PairingFilter) => void;
  setMemoryFilter: (filter: MemoryFilter) => void;
  setPairingSearch: (value: string) => void;
  setMemorySearch: (value: string) => void;
}

export const useAgentStore = create<AgentInteractionState>((set) => ({
  selectedAssetSymbol: "NVDA",
  selectedPairingSlug: "nvda-gpu",
  selectedPairingFactorId: "gpu-narrative",
  selectedLaunchStageId: "PAIRING_VALIDATION",
  selectedSignalId: "nvda-narrative",
  selectedMemoryEventId: "MEM-9841-221",
  activeAdminPanel: "OVERVIEW",
  selectedAdminDecisionId: "asset:NVDA",
  selectedAdminPairingSlug: "nvda-gpu",
  adminPairingReviewOverrides: {},
  adminLaunchControl: "IDLE",
  adminControlNotice: null,
  pairingFilter: "ALL",
  memoryFilter: "ALL",
  pairingSearch: "",
  memorySearch: "",
  setSelectedAssetSymbol: (selectedAssetSymbol) => set({ selectedAssetSymbol }),
  setSelectedPairingSlug: (selectedPairingSlug) => set({ selectedPairingSlug }),
  setSelectedPairingFactorId: (selectedPairingFactorId) => set({ selectedPairingFactorId }),
  setSelectedLaunchStageId: (selectedLaunchStageId) => set({ selectedLaunchStageId }),
  setSelectedSignalId: (selectedSignalId) => set({ selectedSignalId }),
  setSelectedMemoryEventId: (selectedMemoryEventId) => set({ selectedMemoryEventId }),
  setActiveAdminPanel: (activeAdminPanel) => set({ activeAdminPanel }),
  setSelectedAdminDecisionId: (selectedAdminDecisionId) => set({ selectedAdminDecisionId }),
  setSelectedAdminPairingSlug: (selectedAdminPairingSlug) => set({ selectedAdminPairingSlug }),
  setAdminPairingReviewOverride: (slug, reviewState) => set((state) => ({ adminPairingReviewOverrides: { ...state.adminPairingReviewOverrides, [slug]: reviewState } })),
  setAdminLaunchControl: (adminLaunchControl) => set({ adminLaunchControl }),
  setAdminControlNotice: (adminControlNotice) => set({ adminControlNotice }),
  setPairingFilter: (pairingFilter) => set({ pairingFilter }),
  setMemoryFilter: (memoryFilter) => set({ memoryFilter }),
  setPairingSearch: (pairingSearch) => set({ pairingSearch }),
  setMemorySearch: (memorySearch) => set({ memorySearch }),
}));
