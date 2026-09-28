"use client";

import { AnimatePresence, motion } from "framer-motion";

import { AgentStatusBar } from "@/components/agent/AgentStatusBar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
import { useAgentStore } from "@/store/agent-store";

export default function AdminPage() {
  const state = useProtocolState();
  const activeAdminPanel = useAgentStore((store) => store.activeAdminPanel);
  const adminControlNotice = useAgentStore((store) => store.adminControlNotice);

  if (state.isLoading) return <QueryLoadingState title="Loading operator state" />;
  if (state.isError) return <QueryErrorState title="Admin Control Surface Offline" error={state.error} onRetry={() => void state.refetch()} />;
  if (!state.data) return <QueryEmptyState title="No canonical operator state" message="The worker has not published a complete state for the private control surface." />;

  const { agent, assets, launch, memory, pairings, providers } = state.data;
  const launchPairing = launch
    ? pairings.find((pairing) => pairing.slug === launch.selectedPairingSlug) ?? state.data.featuredPairing
    : null;
  return (
    <>
      <AgentStatusBar agentStatus={agent.status} jevStatus={agent.jevStatus} currentOperation={agent.currentOperation} lastDecisionAgeSeconds={agent.lastDecisionAgeSeconds} nextCycleInSeconds={agent.nextCycleInSeconds} networkLabel={agent.networkLabel} />
      <header className="border-b border-[var(--jevo-line)] bg-[rgb(11_13_11_/_72%)]"><div className="protocol-shell flex min-h-30 flex-col justify-center py-6"><p className="protocol-label">Private control surface / worker authorization required</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-medium tracking-[-0.09em] sm:text-5xl">JEVO <span className="text-[var(--jevo-accent)]">ADMIN</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--jevo-muted)]">Human supervision around autonomous observation, structured decisions, and policy-bounded execution.</p></div><span className="border border-[var(--jevo-line)] px-3 py-2 font-mono text-[0.58rem] tracking-[0.07em] text-[var(--jevo-warning)] uppercase">Phase 0 / worker auth proxy</span></div></div></header>
      <main className="protocol-shell py-8 sm:py-10"><div className="grid overflow-hidden border border-[var(--jevo-line)] lg:grid-cols-[13.75rem_minmax(0,1fr)]"><AdminSidebar agent={agent} /><section aria-live="polite" aria-label="Admin workspace" className="min-w-0">{adminControlNotice ? <p role="status" className="border-b border-[var(--jevo-line)] bg-[var(--jevo-accent-soft)] px-5 py-3 font-mono text-[0.6rem] leading-5 tracking-[0.06em] text-[var(--jevo-text)] uppercase">{adminControlNotice}</p> : null}<AnimatePresence mode="wait"><motion.div key={activeAdminPanel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>{activeAdminPanel === "OVERVIEW" ? <OverviewPanel agent={agent} pairings={pairings} launch={launch} /> : null}{activeAdminPanel === "JEV_DECISIONS" ? <JevDecisionsPanel agent={agent} assets={assets} pairings={pairings} memory={memory} /> : null}{activeAdminPanel === "PAIRING_REVIEW" ? <PairingReviewPanel pairings={pairings} /> : null}{activeAdminPanel === "LAUNCH_QUEUE" && launch && launchPairing ? <LaunchQueuePanel launch={launch} pairing={launchPairing} /> : null}{activeAdminPanel === "PROVIDERS" ? <ProvidersPanel providers={providers} /> : null}{activeAdminPanel === "WALLET_CONTRACTS" && launch ? <WalletContractsPanel launch={launch} /> : null}{activeAdminPanel === "AUDIT_LOG" ? <AuditLogPanel agent={agent} memory={memory} pairings={pairings} launch={launch} /> : null}</motion.div></AnimatePresence></section></div></main>
    </>
  );
}
