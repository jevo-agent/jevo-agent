"use client";

import { PanelHead } from "@/components/admin/OverviewPanel";
import { useAgentStore } from "@/store/agent-store";
import { isJevoDemoMode } from "@/lib/api/client";
import { useEmergencyPauseLaunch, useScheduleLaunch } from "@/lib/api/admin-hooks";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface LaunchQueuePanelProps { launch?: Launch | null; pairing?: Pairing | null; }

export function LaunchQueuePanel({ launch, pairing }: LaunchQueuePanelProps) {
  const adminLaunchControl = useAgentStore((state) => state.adminLaunchControl);
  const setAdminLaunchControl = useAgentStore((state) => state.setAdminLaunchControl);
  const setAdminControlNotice = useAgentStore((state) => state.setAdminControlNotice);
  const scheduleLaunch = useScheduleLaunch();
  const pauseLaunch = useEmergencyPauseLaunch();
  const demo = isJevoDemoMode();

  if (!launch || !pairing) {
    return (
      <div>
        <PanelHead title="Launch queue" meta="Autonomous execution / standby" />
        <div className="p-6">
          <p className="font-mono text-xs uppercase text-[var(--jevo-accent)]">Standby / No Active Launch</p>
          <p className="mt-2 text-sm text-[var(--jevo-muted)]">No pairing candidate is currently staged for autonomous execution in the active cycle.</p>
        </div>
      </div>
    );
  }

  const passed = launch.policyChecks.filter((check) => check.status === "PASSED").length;
  const control = async (state: "SCHEDULED" | "PAUSED") => {
    if (demo) { setAdminLaunchControl(state); setAdminControlNotice(`${state === "SCHEDULED" ? "Schedule launch" : "Pause launch"} recorded in explicit demo mode. No canonical launch state was changed.`); return; }
    try {
      if (state === "SCHEDULED") {
        if (!pairing.id) throw new Error("pairing candidate id unavailable");
        await scheduleLaunch.mutateAsync(pairing.id);
      } else {
        await pauseLaunch.mutateAsync(launch.cycleId);
      }
      setAdminControlNotice(`${state === "SCHEDULED" ? "Launch schedule" : "Launch emergency pause"} submitted to the worker.`);
    } catch (error) { setAdminControlNotice(`Launch action failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  return <div><PanelHead title="Launch queue" meta={demo ? "Explicit demo mode / writes disabled" : "Guardian controlled / worker-backed"} /><section className="grid border-b border-[var(--jevo-line)] md:grid-cols-2"><div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0"><p className="protocol-label">{launch.cycleId} / next candidate</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.09em]">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></h2><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">{launch.stage.replaceAll("_", " ")} is active. Contract preparation remains bounded by policy and guardian requirements.</p><dl className="mt-6 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)] font-mono text-[0.61rem] tracking-[0.07em] uppercase"><QueueFact label="Pair score" value={pairing.pairScore.toFixed(1)} /><QueueFact label="Policy checks" value={`${passed} / ${launch.policyChecks.length}`} /><QueueFact label="Guardian" value={launch.guardianRequirement.status} /><QueueFact label="Transaction" value={launch.transactionState.replaceAll("_", " ")} /><QueueFact label="Operator state" value={demo ? adminLaunchControl : launch.readiness} /></dl><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => setAdminControlNotice(demo ? "Demo mode: review opened without a worker mutation." : "Launch candidate is already loaded from the worker state.")} className="h-10 border border-[var(--jevo-accent)] bg-[var(--jevo-accent)] px-3 font-mono text-[0.6rem] tracking-[0.07em] text-[#080a07] uppercase">Open review</button><button type="button" onClick={() => void control("SCHEDULED")} disabled={scheduleLaunch.isPending} className="h-10 border border-[var(--jevo-line)] px-3 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">Schedule</button><button type="button" onClick={() => void control("PAUSED")} disabled={pauseLaunch.isPending} className="h-10 border border-[rgb(255_105_95_/_30%)] px-3 font-mono text-[0.6rem] tracking-[0.07em] text-[var(--jevo-danger)] uppercase">Pause launch</button></div></div><div className="p-6"><p className="protocol-label">Lifecycle / current {launch.stage.replaceAll("_", " ")}</p><ol className="mt-5 divide-y divide-[var(--jevo-line)] border-y border-[var(--jevo-line)]">{launch.stages.map((stage, index) => <li key={stage.id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 py-4"><span className="font-mono text-[0.6rem] text-[var(--jevo-muted)]">{String(index + 1).padStart(2, "0")}</span><span><strong className={stage.status === "ACTIVE" ? "font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-text)] uppercase"}>{stage.id.replaceAll("_", " ")}</strong><small className="mt-1 block text-sm leading-5 text-[var(--jevo-muted)]">{stage.requirement}</small></span><span className="font-mono text-[0.56rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{stage.status === "ACTIVE" ? "Current" : stage.status === "COMPLETE" ? "Complete" : "Pending"}</span></li>)}</ol></div></section></div>;
}

function QueueFact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="text-right text-[var(--jevo-text)]">{value}</dd></div>; }
