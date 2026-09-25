import type { Launch } from "@/types/launch";

interface TokenSpecificationProps { launch: Launch; }

export function TokenSpecification({ launch }: TokenSpecificationProps) {
  const { token } = launch;
  const items = [["Name", token.name], ["Symbol", token.symbol], ["Pairing asset", token.pairingAsset], ["Network", token.network], ["Launch mechanism", token.launchMechanism], ["Contract", token.contractState]];
  return <section aria-labelledby="token-specification-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="token-specification-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Token specification</h2><p className="protocol-label">Prepared launch metadata / Phase 0</p></div><dl className="grid border-l border-[var(--jevo-line)] sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <div key={label} className="min-h-28 border-r border-b border-[var(--jevo-line)] p-5"><dt className="protocol-label">{label}</dt><dd className="mt-4 font-mono text-base tracking-[-0.04em] text-[var(--jevo-text)]">{value}</dd></div>)}</dl></section>;
}
