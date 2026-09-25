import type { Pairing } from "@/types/pairing";

interface PairingThesisProps { pairing: Pairing; }

export function PairingThesis({ pairing }: PairingThesisProps) {
  const proof = ["Narrative Fit", "Cultural Fit", "Timing"].map((label) => pairing.factors.find((factor) => factor.label === label)).filter((factor): factor is Pairing["factors"][number] => Boolean(factor));

  return (
    <section aria-labelledby="pair-thesis-title" className="border-b border-[var(--jevo-line)]">
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="pair-thesis-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Pairing thesis</h2><p className="protocol-label">Stock opportunity → crypto-native concept</p></div>
      <div className="grid xl:grid-cols-2">
        <div className="border-b border-[var(--jevo-line)] p-6 xl:border-r xl:border-b-0">
          <p className="protocol-label">Core translation</p>
          <p className="mt-5 max-w-2xl text-4xl font-medium leading-[0.97] tracking-[-0.075em] sm:text-5xl">{pairing.thesis.core.split("crypto-native")[0]}<span className="text-[var(--jevo-accent)]">crypto-native</span>{pairing.thesis.core.split("crypto-native").slice(1).join("crypto-native")}</p>
          <p className="mt-6 max-w-2xl leading-7 text-[var(--jevo-muted)]">This Phase 0 protocol state records a structured pairing decision. It is not live market analysis or an investment-return prediction.</p>
          <dl className="mt-8 grid border-t border-l border-[var(--jevo-line)] sm:grid-cols-3">{proof.map((factor) => <div key={factor.id} className="border-r border-b border-[var(--jevo-line)] p-4"><dt className="protocol-label">{factor.label}</dt><dd className="mt-3 font-mono text-2xl tracking-[-0.07em] text-[var(--jevo-text)]">{factor.score}</dd><p className="mt-2 font-mono text-[0.58rem] tracking-[0.06em] text-[var(--jevo-accent)] uppercase">{factor.state}</p></div>)}</dl>
        </div>
        <dl className="grid content-start p-6 sm:grid-cols-2">{[
          ["Why stock?", pairing.thesis.whyStock], ["Why meme?", pairing.thesis.whyMeme], ["Why this pair?", pairing.thesis.whyPair], ["Why now?", pairing.thesis.whyNow],
        ].map(([label, value]) => <div key={label} className="border-b border-[var(--jevo-line)] py-5 odd:sm:pr-5 even:sm:pl-5 sm:nth-[n+3]:border-b-0"><dt className="font-mono text-[0.63rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase">{label}</dt><dd className="mt-3 text-sm leading-6 text-[var(--jevo-muted)]">{value}</dd></div>)}</dl>
      </div>
    </section>
  );
}
