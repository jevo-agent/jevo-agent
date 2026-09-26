"use client";

import { useAgentStore } from "@/store/agent-store";
import { formatNumber, formatCycle } from "@/lib/format";
import { isJevoDemoMode } from "@/lib/api/client";
import { usePauseAgent, useResumeAgent, useTriggerScan } from "@/lib/api/admin-hooks";
import type { AgentRuntime } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface OverviewPanelProps { agent: AgentRuntime; pairings: Pairing[]; launch: Launch; }

export function OverviewPanel({ agent, pairings, launch }: OverviewPanelProps) {
  const adminControlNotice = useAgentStore((state) => state.adminControlNotice);
  const setAdminControlNotice = useAgentStore((state) => state.setAdminControlNotice);
  const triggerScan = useTriggerScan();
  const pauseAgent = usePauseAgent();
  const resumeAgent = useResumeAgent();
  const demo = isJevoDemoMode();
  const proposed = pairings.filter((pairing) => pairing.status === "AGENT_PROPOSED").length;
  const candidates = pairings.filter((pairing) => pairing.status === "LAUNCH_CANDIDATE").length;
  const passedChecks = launch.policyChecks.filter((check) => check.status === "PASSED").length;
  const runScan = async () => {
    if (demo) { setAdminControlNotice("Demo mode: scan trigger is disabled and no canonical state was changed."); return; }
    try { await triggerScan.mutateAsync("DELTA"); setAdminControlNotice("Scan trigger submitted to the worker."); }
    catch (error) { setAdminControlNotice(`Scan trigger failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  const togglePause = async () => {
    if (demo) { setAdminControlNotice("Demo mode: agent control is disabled and no canonical state was changed."); return; }
    try { if (agent.status === "PAUSED") { await resumeAgent.mutateAsync(); setAdminControlNotice("Agent resume submitted to the worker."); } else { await pauseAgent.mutateAsync(); setAdminControlNotice("Agent pause submitted to the worker."); } }
    catch (error) { setAdminControlNotice(`Agent control failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  const busy = triggerScan.isPending || pauseAgent.isPending || resumeAgent.isPending;
  return <div><PanelHead title="Overview" meta="Runtime / operator controlled" /><div className="grid border-l border-[var(--jevo-line)] md:grid-cols-3"><Metric label="Agent state" value={agent.status} copy="JEVO is processing the active protocol cycle." accent /><Metric label="Active cycle" value={formatCycle(agent.activeCycle)} copy="Latest structured JEV state is retained." /><Metric label="Pending review" value={proposed.toString().padStart(2, "0")} copy="Agent-proposed pairings await human review." warning /></div><section className="border-b border-[var(--jevo-line)]"><PanelHead title="Agent control" meta={demo ? "Explicit demo mode / writes disabled" : "Worker control / authenticated proxy"} /><div className="grid md:grid-cols-2"><div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0"><p className="protocol-label">Current operation</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.07em]">{agent.currentOperation}.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[var(--jevo-muted)]">Controls submit operator actions to the worker; the next SSE or query refresh publishes the resulting state.</p><div className="mt-6 flex flex-wrap gap-2"><Control label={busy ? "Submitting…" : "Trigger scan"} onClick={runScan} accent /><Control label={agent.status === "PAUSED" ? "Resume agent" : "Pause agent"} onClick={togglePause} danger /></div>{adminControlNotice ? <p role="status" className="mt-5 border border-[var(--jevo-line)] p-3 font-mono text-[0.6rem] leading-5 tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{adminControlNotice}</p> : null}</div><dl className="p-6 font-mono text-[0.63rem] tracking-[0.07em] uppercase"><Fact label="Assets evaluated" value={formatNumber(agent.assetsScanned)} /><Fact label="Signals processed" value={formatNumber(agent.signalsProcessed)} /><Fact label="JEV decisions" value={formatNumber(agent.decisionsProcessed)} /><Fact label="High conviction" value={agent.highConvictionCandidates.toString()} /><Fact label="Launch candidates" value={candidates.toString()} /><Fact label="Policy state" value={`${passedChecks} / ${launch.policyChecks.length} passed`} /><Fact label="Transaction" value={launch.transactionState.replaceAll("_", " ")} /></dl></div></section></div>;
}

export function PanelHead({ title, meta }: { title: string; meta: string }) { return <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 className="font-mono text-[0.7rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">{title}</h2><p className="protocol-label">{meta}</p></div>; }
function Metric({ label, value, copy, accent = false, warning = false }: { label: string; value: string; copy: string; accent?: boolean; warning?: boolean }) { return <article className="min-h-44 border-r border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">{label}</p><p className={accent ? "mt-4 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-accent)]" : warning ? "mt-4 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-warning)]" : "mt-4 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-text)]"}>{value}</p><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{copy}</p></article>; }
function Fact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-5 border-b border-[var(--jevo-line)] py-3 last:border-b-0"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-52 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
function Control({ label, onClick, accent = false, danger = false }: { label: string; onClick: () => void; accent?: boolean; danger?: boolean }) { return <button type="button" onClick={onClick} className={accent ? "h-10 border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-3 font-mono text-[0.61rem] tracking-[0.07em] text-[#080a07] uppercase" : danger ? "h-10 border border-[rgb(255_105_95_/_30%)] px-3 font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-danger)] uppercase" : "h-10 border border-[var(--jevo-line)] px-3 font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase"}>{label}</button>; }
