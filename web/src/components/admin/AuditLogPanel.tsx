import { PanelHead } from "@/components/admin/OverviewPanel";
import { formatClock } from "@/lib/format";
import type { AgentRuntime, MemoryRecord } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface AuditLogPanelProps { agent: AgentRuntime; memory: MemoryRecord[]; pairings: Pairing[]; launch: Launch; }

export function AuditLogPanel({ agent, memory, pairings, launch }: AuditLogPanelProps) {
  const pairingEvents = pairings.flatMap((pairing) => pairing.history.map((event) => ({ id: `${pairing.slug}-${event.timestamp}`, timestamp: event.timestamp, actor: "JEVO_AGENT", subject: `${pairing.stockSymbol} × ${pairing.symbol}`, previous: "—", current: event.state.replaceAll("_", " "), result: "Recorded", summary: event.summary })));
  const launchEvents = launch.activity.map((event) => ({ id: event.id, timestamp: event.timestamp, actor: "JEVO_AGENT", subject: launch.cycleId, previous: "—", current: event.type, result: "Recorded", summary: event.summary }));
  const memoryEvents = memory.map((event) => ({ id: event.id, timestamp: event.timestamp, actor: event.actor, subject: event.subject, previous: event.previousState, current: event.currentState, result: event.decision.replaceAll("_", " "), summary: event.summary }));
  const entries = [...memoryEvents, ...pairingEvents, ...launchEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const agentActions = entries.filter((entry) => entry.actor === "JEVO_AGENT").length;
  return <div><PanelHead title="Audit log" meta="Observable operator and agent actions" /><section aria-label="Operational audit trail" className="divide-y divide-[var(--jevo-line)]">{entries.map((entry) => <article key={entry.id} className="grid gap-3 px-5 py-5 sm:grid-cols-[7rem_8rem_minmax(0,1fr)_8rem]"><time dateTime={entry.timestamp} className="font-mono text-[0.6rem] tracking-[0.06em] text-[var(--jevo-muted)]">{formatClock(entry.timestamp)} UTC</time><span className="font-mono text-[0.57rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{entry.actor.replaceAll("_", " ")}</span><span><strong className="block text-sm font-medium text-[var(--jevo-text)]">{entry.subject}</strong><p className="mt-1 text-sm leading-6 text-[var(--jevo-muted)]">{entry.summary}</p><p className="mt-2 font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">{entry.previous} → {entry.current}</p></span><span className="font-mono text-[0.57rem] tracking-[0.06em] text-[var(--jevo-accent)] uppercase sm:text-right">{entry.result}</span></article>)}</section><section className="grid border-t border-[var(--jevo-line)] md:grid-cols-3"><AuditMetric label="Events represented" value={entries.length.toString()} /><AuditMetric label="Operator actions" value={entries.filter((entry) => entry.actor === "OPERATOR").length.toString()} /><AuditMetric label="Agent actions" value={agentActions.toString()} accent /><div className="sr-only">Active cycle {agent.activeCycle}</div></section></div>;
}

function AuditMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="min-h-32 border-r border-b border-[var(--jevo-line)] p-6"><p className="protocol-label">{label}</p><p className={accent ? "mt-4 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-accent)]" : "mt-4 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-text)]"}>{value}</p></div>; }
