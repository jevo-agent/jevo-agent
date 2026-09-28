"use client";

import { AnimatePresence, motion } from "framer-motion";

import { AppShell } from "@/components/app/AppShell";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { JevDecisionsPanel } from "@/components/admin/JevDecisionsPanel";
import { LaunchQueuePanel } from "@/components/admin/LaunchQueuePanel";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { PairingReviewPanel } from "@/components/admin/PairingReviewPanel";
import { ProvidersPanel } from "@/components/admin/ProvidersPanel";
import { WalletContractsPanel } from "@/components/admin/WalletContractsPanel";
import { QueryEmptyState } from "@/components/ui/QueryEmptyState";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import { QueryLoadingState } from "@/components/ui/QueryLoadingState";
import { useProtocolState } from "@/lib/api/hooks";
import { isJevoDemoMode } from "@/lib/api/client";
import { useAgentStore } from "@/store/agent-store";

export default function AdminPage() {
  const state = useProtocolState();
  const activeAdminPanel = useAgentStore((store) => store.activeAdminPanel);
  const adminControlNotice = useAgentStore((store) => store.adminControlNotice);
  const setAdminControlNotice = useAgentStore((store) => store.setAdminControlNotice);
  const demo = isJevoDemoMode();

  if (state.isLoading) return <QueryLoadingState title="Loading operator state" />;
  if (state.isError) {
    return (
      <QueryErrorState
        title="Admin Control Surface Offline"
        error={state.error}
        onRetry={() => void state.refetch()}
      />
    );
  }
  if (!state.data) {
    return (
      <QueryEmptyState
        title="No canonical operator state"
        message="The worker has not published a complete state for the private control surface."
      />
    );
  }

  const { agent, assets, launch, memory, pairings, providers } = state.data;
  const launchPairing = launch
    ? pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug) ?? state.data.featuredPairing
    : null;

  return (
    <AppShell
      {...state.data}
      activeSection="admin"
      breadcrumb={
        <div className="crumbs">
          JEVO <span>/</span> <b>ADMIN</b>
        </div>
      }
    >
      <div className="admin-root">
        {/* Page Header */}
        <header className="admin-header">
          <div className="admin-header-main">
            <div className="eyebrow">
              <span className="live-dot" />
              <span className="label">
                Private control surface · Worker authorization required
              </span>
            </div>
            <div className="admin-title-row">
              <div>
                <h1 className="admin-title">
                  JEVO <span className="hl">ADMIN</span>
                </h1>
                <p className="admin-lead">
                  Human supervision around autonomous observation, structured decisions, and policy-bounded execution.
                </p>
              </div>
              <div className="admin-header-badges">
                {demo ? (
                  <span className="admin-badge admin-badge--demo">
                    DEMO MODE · WRITES INACTIVE
                  </span>
                ) : null}
                <span className="admin-badge admin-badge--proxy">
                  Phase 0 / worker auth proxy
                </span>
              </div>
            </div>
          </div>

          {/* Action result banner */}
          {adminControlNotice ? (
            <div role="status" className="admin-action-notice">
              <span className="admin-action-dot" aria-hidden="true" />
              <span className="admin-action-text">{adminControlNotice}</span>
              <button
                type="button"
                onClick={() => setAdminControlNotice(null)}
                className="admin-action-dismiss"
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </div>
          ) : null}

          {/* Explicit demo banner */}
          {demo ? (
            <aside className="admin-demo-banner" aria-label="Demo mode notice">
              <span className="admin-demo-tag">DEMO MODE</span>
              <p>
                Explicit demo mode is active. Operator actions are recorded locally for interface testing; no mutations are sent to the worker backend.
              </p>
            </aside>
          ) : null}
        </header>

        {/* Horizontal Navigation Tabs */}
        <AdminTabBar pairings={pairings} providers={providers} />

        {/* Panel Content Container */}
        <main
          className="admin-panel-container"
          aria-live="polite"
          aria-label="Admin workspace panel"
        >
          <div
            id={`admin-panel-${activeAdminPanel.toLowerCase()}`}
            role="tabpanel"
            aria-labelledby={`admin-tab-${activeAdminPanel.toLowerCase()}`}
            className="min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAdminPanel}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {activeAdminPanel === "OVERVIEW" ? (
                  <OverviewPanel agent={agent} pairings={pairings} launch={launch} />
                ) : null}
                {activeAdminPanel === "JEV_DECISIONS" ? (
                  <JevDecisionsPanel
                    agent={agent}
                    assets={assets}
                    pairings={pairings}
                    memory={memory}
                  />
                ) : null}
                {activeAdminPanel === "PAIRING_REVIEW" ? (
                  <PairingReviewPanel pairings={pairings} />
                ) : null}
                {activeAdminPanel === "LAUNCH_QUEUE" ? (
                  <LaunchQueuePanel launch={launch} pairing={launchPairing} />
                ) : null}
                {activeAdminPanel === "PROVIDERS" ? (
                  <ProvidersPanel providers={providers} />
                ) : null}
                {activeAdminPanel === "WALLET_CONTRACTS" ? (
                  <WalletContractsPanel launch={launch} />
                ) : null}
                {activeAdminPanel === "AUDIT_LOG" ? (
                  <AuditLogPanel
                    agent={agent}
                    memory={memory}
                    pairings={pairings}
                    launch={launch}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
