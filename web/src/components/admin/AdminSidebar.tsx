"use client";

import { useAgentStore } from "@/store/agent-store";
import type { AgentRuntime } from "@/types/agent";

const navigation = [{ id: "OVERVIEW", label: "Overview" }, { id: "JEV_DECISIONS", label: "JEV Decisions" }, { id: "PAIRING_REVIEW", label: "Pairing Review" }, { id: "LAUNCH_QUEUE", label: "Launch Queue" }, { id: "PROVIDERS", label: "Providers" }, { id: "WALLET_CONTRACTS", label: "Wallet & Contracts" }, { id: "AUDIT_LOG", label: "Audit Log" }] as const;

interface AdminSidebarProps { agent: AgentRuntime; }

export function AdminSidebar({ agent }: AdminSidebarProps) {
  const activeAdminPanel = useAgentStore((state) => state.activeAdminPanel);
  const setActiveAdminPanel = useAgentStore((state) => state.setActiveAdminPanel);
  return <aside aria-label="Admin navigation" className="border-b border-[var(--jevo-line)] bg-[rgb(13_16_13_/_72%)] p-3 lg:min-h-210 lg:border-r lg:border-b-0"><p className="px-2 pt-2 font-mono text-sm font-bold tracking-[-0.07em]">JEVO ADMIN</p><p className="mt-2 px-2 font-mono text-[0.55rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">Internal control surface</p><nav className="mt-5 flex gap-1 overflow-x-auto lg:block lg:space-y-1">{navigation.map((item) => <button key={item.id} type="button" aria-pressed={activeAdminPanel === item.id} onClick={() => setActiveAdminPanel(item.id)} className={activeAdminPanel === item.id ? "h-10 shrink-0 border border-[rgb(215_255_63_/_22%)] bg-[var(--jevo-accent-soft)] px-3 font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase lg:block lg:w-full lg:text-left" : "h-10 shrink-0 border border-transparent px-3 font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-text)] lg:block lg:w-full lg:text-left"}>{item.label}</button>)}</nav><dl className="mt-6 hidden divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.57rem] tracking-[0.07em] uppercase lg:block"><SidebarFact label="Agent" value={agent.status} accent /><SidebarFact label="JEV" value={agent.jevStatus} accent /><SidebarFact label="Network" value={agent.networkLabel} /><SidebarFact label="Active cycle" value={agent.activeCycle.toString()} /></dl></aside>;
}

function SidebarFact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="flex justify-between gap-3 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className={accent ? "text-[var(--jevo-accent)]" : "max-w-28 text-right text-[var(--jevo-text)]"}>{value}</dd></div>; }
