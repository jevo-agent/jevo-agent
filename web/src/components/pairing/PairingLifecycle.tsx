import type { Pairing } from "@/types/pairing";

interface PairingLifecycleProps { pairing: Pairing; }

export function PairingLifecycle({ pairing }: PairingLifecycleProps) {
  return (
    <div className="mt-6"><p className="protocol-label">Pairing lifecycle</p><ol className="mt-3 grid grid-cols-3 border border-[var(--jevo-line)] sm:grid-cols-6">{pairing.lifecycle.map((step) => <li key={step.stage} className={step.status === "ACTIVE" ? "min-h-18 border-r border-b border-[var(--jevo-line)] bg-[var(--jevo-accent-soft)] p-3 last:border-r-0 sm:border-b-0" : "min-h-18 border-r border-b border-[var(--jevo-line)] p-3 last:border-r-0 sm:border-b-0"}><span className="block font-mono text-[0.55rem] tracking-[0.06em] text-[var(--jevo-muted)]">{step.status === "COMPLETE" ? "COMPLETE" : step.status}</span><strong className={step.status === "ACTIVE" ? "mt-2 block text-[0.65rem] leading-4 text-[var(--jevo-accent)]" : "mt-2 block text-[0.65rem] leading-4 text-[var(--jevo-text)]"}>{step.stage.replaceAll("_", " ")}</strong></li>)}</ol></div>
  );
}
