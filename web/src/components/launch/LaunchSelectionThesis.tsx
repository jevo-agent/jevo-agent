import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface LaunchSelectionThesisProps { launch: Launch; pairing: Pairing; stock: Stock; }

export function LaunchSelectionThesis({ launch, pairing, stock }: LaunchSelectionThesisProps) {
  const narrative = stock.signals.find((signal) => signal.label === "Narrative Momentum");
  const cultural = stock.signals.find((signal) => signal.label === "Cultural Relevance");
  const compatibility = stock.signals.find((signal) => signal.label === "Pair Compatibility");
  const passedChecks = launch.policyChecks.filter((check) => check.status === "PASSED").length;
  const evidence = [
    { label: "Stock opportunity", value: stock.opportunityScore.toFixed(1), copy: "Current opportunity state for the selected Stock Token." },
    { label: "Narrative momentum", value: narrative ? `${narrative.score}` : "—", copy: narrative?.explanation ?? "No current narrative signal is published." },
    { label: "Pairing compatibility", value: compatibility ? `${compatibility.score}` : pairing.pairScore.toFixed(1), copy: compatibility?.explanation ?? pairing.thesis.whyPair },
    { label: "Cultural relevance", value: cultural ? `${cultural.score}` : "—", copy: cultural?.explanation ?? pairing.thesis.whyMeme },
    { label: "Policy readiness", value: `${passedChecks} / ${launch.policyChecks.length}`, copy: "Structured policy checks are passing; guardian approval remains required." },
  ];

  return <section aria-labelledby="launch-selection-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="launch-selection-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Why this was selected</h2><p className="protocol-label">JEV decision evidence</p></div><div className="p-6 sm:p-8"><p className="protocol-label">Selection thesis / {pairing.stockSymbol} × {pairing.symbol}</p><h3 className="mt-5 max-w-3xl text-4xl font-medium leading-[0.96] tracking-[-0.075em] sm:text-5xl">A high-coherence pairing selected through <span className="text-[var(--jevo-accent)]">opportunity, cultural, and policy states.</span></h3><p className="mt-6 max-w-3xl leading-7 text-[var(--jevo-muted)]">{pairing.thesis.core} Selection is based on published structured evidence, not simply the highest score.</p></div><dl className="grid border-t border-l border-[var(--jevo-line)] sm:grid-cols-2 xl:grid-cols-5">{evidence.map((item) => <div key={item.label} className="min-h-44 border-r border-b border-[var(--jevo-line)] p-5"><dt className="protocol-label">{item.label}</dt><dd className="mt-4 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]">{item.value}</dd><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{item.copy}</p></div>)}</dl></section>;
}
