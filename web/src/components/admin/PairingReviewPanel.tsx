"use client";

import { AnimatePresence, motion } from "framer-motion";

import { PanelHead } from "@/components/admin/OverviewPanel";
import { useAgentStore } from "@/store/agent-store";
import { isJevoDemoMode } from "@/lib/api/client";
import { useApprovePairing, useRejectPairing } from "@/lib/api/admin-hooks";
import type { Pairing } from "@/types/pairing";

interface PairingReviewPanelProps { pairings: Pairing[]; }

export function PairingReviewPanel({ pairings }: PairingReviewPanelProps) {
  const selectedAdminPairingSlug = useAgentStore((state) => state.selectedAdminPairingSlug);
  const setSelectedAdminPairingSlug = useAgentStore((state) => state.setSelectedAdminPairingSlug);
  const overrides = useAgentStore((state) => state.adminPairingReviewOverrides);
  const setOverride = useAgentStore((state) => state.setAdminPairingReviewOverride);
  const setAdminControlNotice = useAgentStore((state) => state.setAdminControlNotice);
  const approvePairing = useApprovePairing();
  const rejectPairing = useRejectPairing();
  const demo = isJevoDemoMode();
  const selected = pairings.find((pairing) => pairing.slug === selectedAdminPairingSlug) ?? pairings[0];
  const reviewState = (pairing: Pairing) => demo ? overrides[pairing.slug] ?? pairing.status : pairing.status;
  const action = async (pairing: Pairing, state: "APPROVED" | "REJECTED" | "RETURNED_TO_REVIEW") => {
    if (demo) { setOverride(pairing.slug, state); setAdminControlNotice(`${state.replaceAll("_", " ")} recorded in explicit demo mode. No canonical pairing data was changed.`); return; }
    if (state === "RETURNED_TO_REVIEW") { setAdminControlNotice("Return to review has no worker mutation endpoint; canonical pairing state was not changed."); return; }
    if (!pairing.id) { setAdminControlNotice("This pairing has no canonical worker id; action was not submitted."); return; }
    try {
      if (state === "APPROVED") await approvePairing.mutateAsync(pairing.id);
      else await rejectPairing.mutateAsync(pairing.id);
      setAdminControlNotice(`${state} submitted to the worker for ${pairing.stockSymbol} × ${pairing.symbol}.`);
    } catch (error) { setAdminControlNotice(`Pairing action failed: ${error instanceof Error ? error.message : "unknown error"}`); }
  };
  return <div><PanelHead title="Pairing review" meta={demo ? "Explicit demo mode / writes disabled" : "Agent proposes → human curates"} /><div role="group" aria-label="Pairing proposals" className="grid border-l border-[var(--jevo-line)] md:grid-cols-2 xl:grid-cols-3">{pairings.map((pairing) => <article key={pairing.slug} className={selected.slug === pairing.slug ? "min-h-68 border-r border-b border-[var(--jevo-line)] bg-[var(--jevo-accent-soft)] p-6" : "min-h-68 border-r border-b border-[var(--jevo-line)] p-6"}><p className="protocol-label">{pairing.slug} / {reviewState(pairing).replaceAll("_", " ")}</p><button type="button" aria-pressed={selected.slug === pairing.slug} onClick={() => setSelectedAdminPairingSlug(pairing.slug)} className="mt-4 text-left"><h2 className="text-3xl font-medium tracking-[-0.08em]">{pairing.stockSymbol} × <span className="text-[var(--jevo-accent)]">{pairing.symbol}</span></h2><p className="mt-4 text-sm leading-6 text-[var(--jevo-muted)]">{pairing.thesis.core}</p></button><p className="mt-5 font-mono text-3xl tracking-[-0.08em] text-[var(--jevo-text)]">{pairing.pairScore.toFixed(1)}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedAdminPairingSlug(pairing.slug)} className="h-8 border border-[var(--jevo-line)] px-2 font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">Inspect</button><button type="button" onClick={() => void action(pairing, "APPROVED")} className="h-8 border border-[rgb(215_255_63_/_28%)] px-2 font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-accent)] uppercase">Approve</button><button type="button" onClick={() => void action(pairing, "RETURNED_TO_REVIEW")} className="h-8 border border-[var(--jevo-line)] px-2 font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-muted)] uppercase">Return</button><button type="button" onClick={() => void action(pairing, "REJECTED")} className="h-8 border border-[rgb(255_105_95_/_30%)] px-2 font-mono text-[0.56rem] tracking-[0.06em] text-[var(--jevo-danger)] uppercase">Reject</button></div></article>)}</div><AnimatePresence mode="wait"><motion.section key={selected.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} aria-labelledby="selected-pairing-title" className="grid border-b border-[var(--jevo-line)] md:grid-cols-2"><div className="border-b border-[var(--jevo-line)] p-6 md:border-r md:border-b-0"><p className="protocol-label">Selected proposal / {reviewState(selected).replaceAll("_", " ")}</p><h2 id="selected-pairing-title" className="mt-4 text-3xl font-medium tracking-[-0.07em]">{selected.stockSymbol} × <span className="text-[var(--jevo-accent)]">{selected.symbol}</span></h2><p className="mt-5 text-sm leading-6 text-[var(--jevo-muted)]">{selected.thesis.core}</p><p className="mt-3 text-sm leading-6 text-[var(--jevo-muted)]">Review copy, symbol, narrative fit, and why-now before publishing. {demo ? "Demo mode does not write to the worker." : "Actions submit to the authenticated worker proxy."}</p></div><dl className="p-6 font-mono text-[0.61rem] tracking-[0.07em] text-[var(--jevo-muted)] tracking-[0.07em] uppercase"><ReviewFact label="JEV pairing" value={selected.jevDecision.replaceAll("_", " ")} /><ReviewFact label="Pair score" value={selected.pairScore.toFixed(1)} /><ReviewFact label="Confidence" value={`${selected.confidence}%`} /><ReviewFact label="Review state" value={reviewState(selected).replaceAll("_", " ")} /><ReviewFact label="Factors" value={selected.factors.map((factor) => `${factor.label} ${factor.score}`).join(" · ")} /></dl></motion.section></AnimatePresence></div>;
}

function ReviewFact({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-[var(--jevo-line)] py-3 last:border-b-0"><dt className="text-[var(--jevo-muted)]">{label}</dt><dd className="max-w-64 text-right text-[var(--jevo-text)]">{value}</dd></div>; }
