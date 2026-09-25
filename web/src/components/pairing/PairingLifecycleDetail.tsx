import { formatClock } from "@/lib/format";
import type { Pairing } from "@/types/pairing";

interface PairingLifecycleDetailProps { pairing: Pairing; }

export function PairingLifecycleDetail({ pairing }: PairingLifecycleDetailProps) {
  return (
    <section aria-labelledby="pairing-lifecycle-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4"><h2 id="pairing-lifecycle-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Pairing lifecycle</h2><p className="protocol-label">Current state</p></div>
      <ol className="p-5">{pairing.lifecycle.map((step, index) => <li key={step.stage} className={step.status === "ACTIVE" ? "grid grid-cols-[1.6rem_minmax(0,1fr)_auto] gap-3 border-l border-[var(--jevo-accent)] bg-[var(--jevo-accent-soft)] px-4 py-4" : "grid grid-cols-[1.6rem_minmax(0,1fr)_auto] gap-3 border-l border-[var(--jevo-line)] px-4 py-4"}><span className="font-mono text-[0.62rem] text-[var(--jevo-muted)]">{String(index + 1).padStart(2, "0")}</span><div><strong className={step.status === "ACTIVE" ? "font-mono text-[0.66rem] tracking-[0.07em] text-[var(--jevo-accent)] uppercase" : "font-mono text-[0.66rem] tracking-[0.07em] text-[var(--jevo-text)] uppercase"}>{step.stage.replaceAll("_", " ")}</strong>{step.timestamp ? <time dateTime={step.timestamp} className="mt-1 block font-mono text-[0.56rem] tracking-[0.05em] text-[var(--jevo-muted)]">{formatClock(step.timestamp)} UTC</time> : null}</div><span className="font-mono text-[0.56rem] tracking-[0.07em] text-[var(--jevo-muted)] uppercase">{step.status === "COMPLETE" ? "Complete" : step.status === "ACTIVE" ? "Current" : "Future"}</span></li>)}</ol>
    </section>
  );
}
