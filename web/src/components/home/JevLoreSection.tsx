export function JevLoreSection() {
  return (
    <section className="border-b border-[var(--jevo-line)] py-20 sm:py-28" aria-labelledby="lore-title">
      <div className="protocol-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border-t border-[var(--jevo-line)] pt-5"><p className="protocol-label">Jev / Decision layer</p><h2 id="lore-title" className="mt-5 max-w-sm text-4xl font-medium leading-[0.92] tracking-[-0.08em] text-[var(--jevo-text)]">From state to action.</h2></div>
        <div className="border-t border-[var(--jevo-line)]"><div className="divide-y divide-[var(--jevo-line)]"><LoreRow label="Traditional AI" value="Input → Reason → Generate text" /><LoreRow label="JEVO + JEV" value="State → Decision → Structured action" accent /><LoreRow label="Agent memory" value="Previous state → Current state → Next state" /></div><p className="max-w-2xl py-7 text-lg leading-8 tracking-[-0.025em] text-[#b7beb0]">Markets continuously produce changing signals. JEVO observes those signals, uses Jev to classify and evaluate opportunity states, records what changed, and moves qualified opportunities toward stock-to-meme pairing and controlled launch workflows.</p></div>
      </div>
    </section>
  );
}

function LoreRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="grid gap-3 py-5 sm:grid-cols-[140px_minmax(0,1fr)_24px]"><span className="font-mono text-[0.625rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">{label}</span><span className={accent ? "text-lg tracking-[-0.04em] text-[var(--jevo-accent)]" : "text-lg tracking-[-0.04em] text-[var(--jevo-text)]"}>{value}</span><span className="text-[var(--jevo-muted)]" aria-hidden="true">→</span></div>;
}
