"use client";

import { useEffect, useMemo } from "react";
import { useAgentStore } from "@/store/agent-store";
import type { Pairing } from "@/types/pairing";
import type { ProviderReference } from "@/types/agent";

export type AdminPanel =
  | "OVERVIEW"
  | "JEV_DECISIONS"
  | "PAIRING_REVIEW"
  | "LAUNCH_QUEUE"
  | "PROVIDERS"
  | "WALLET_CONTRACTS"
  | "AUDIT_LOG";

const PANEL_TO_HASH: Record<AdminPanel, string> = {
  OVERVIEW: "overview",
  JEV_DECISIONS: "jev-decisions",
  PAIRING_REVIEW: "pairing-review",
  LAUNCH_QUEUE: "launch-queue",
  PROVIDERS: "providers",
  WALLET_CONTRACTS: "wallet-contracts",
  AUDIT_LOG: "audit-log",
};

const HASH_TO_PANEL: Record<string, AdminPanel> = {
  overview: "OVERVIEW",
  "jev-decisions": "JEV_DECISIONS",
  "pairing-review": "PAIRING_REVIEW",
  "launch-queue": "LAUNCH_QUEUE",
  providers: "PROVIDERS",
  "wallet-contracts": "WALLET_CONTRACTS",
  "audit-log": "AUDIT_LOG",
};

interface AdminTabBarProps {
  pairings: Pairing[];
  providers: ProviderReference[];
}

export function AdminTabBar({ pairings, providers }: AdminTabBarProps) {
  const activeAdminPanel = useAgentStore((state) => state.activeAdminPanel);
  const setActiveAdminPanel = useAgentStore((state) => state.setActiveAdminPanel);

  // Deep-link sync with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, "").toLowerCase();
      if (hash && HASH_TO_PANEL[hash]) {
        setActiveAdminPanel(HASH_TO_PANEL[hash]);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [setActiveAdminPanel]);

  const selectPanel = (panel: AdminPanel) => {
    setActiveAdminPanel(panel);
    if (typeof window !== "undefined") {
      const hash = PANEL_TO_HASH[panel];
      window.history.replaceState(null, "", `#${hash}`);
    }
  };

  const pendingPairingsCount = useMemo(
    () => pairings.filter((p) => p.status === "AGENT_PROPOSED").length,
    [pairings],
  );

  const tabs: Array<{ id: AdminPanel; label: string; count?: string }> = useMemo(
    () => [
      { id: "OVERVIEW", label: "Overview" },
      { id: "JEV_DECISIONS", label: "JEV Decisions" },
      {
        id: "PAIRING_REVIEW",
        label: "Pairing Review",
        count: `${pendingPairingsCount} pending`,
      },
      { id: "LAUNCH_QUEUE", label: "Launch Queue" },
      {
        id: "PROVIDERS",
        label: "Providers",
        count: providers.length > 0 ? String(providers.length) : undefined,
      },
      { id: "WALLET_CONTRACTS", label: "Wallet & Contracts" },
      { id: "AUDIT_LOG", label: "Audit Log" },
    ],
    [pendingPairingsCount, providers.length],
  );

  return (
    <div
      className="admin-tab-bar"
      role="tablist"
      aria-label="Admin workspace sections"
    >
      {tabs.map((tab) => {
        const isActive = activeAdminPanel === tab.id;
        return (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`admin-panel-${tab.id.toLowerCase()}`}
            onClick={() => selectPanel(tab.id)}
            className={`admin-tab-btn ${isActive ? "is-active" : ""}`}
          >
            <span className="admin-tab-label">{tab.label}</span>
            {tab.count !== undefined ? (
              <span className="admin-tab-count" aria-label={`${tab.count}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
