export function QueryLoadingState({ title = "Connecting to JEVO worker" }: { title?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="border border-[var(--jevo-line)] px-6 py-5 text-center">
        <p className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-accent)] uppercase">{title}</p>
        <p className="mt-2 font-mono text-[0.58rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">Awaiting canonical worker state</p>
      </div>
    </div>
  );
}

