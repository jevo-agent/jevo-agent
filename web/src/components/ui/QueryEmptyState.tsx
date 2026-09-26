export function QueryEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-lg border border-[var(--jevo-line)] px-6 py-5">
        <p className="font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase">{title}</p>
        <p className="mt-3 text-sm leading-6 text-[var(--jevo-text-2)]">{message}</p>
      </div>
    </div>
  );
}

