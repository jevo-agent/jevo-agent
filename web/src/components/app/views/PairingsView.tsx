"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import type { Pairing } from "@/types/pairing";

export function PairingsView({ pairings }: { pairings: Pairing[] }) {
  const [selectedSlug, setSelectedSlug] = useState(pairings[0]?.slug ?? "");
  const selected = pairings.find((pairing) => pairing.slug === selectedSlug) ?? pairings[0];

  if (!selected) {
    return (
      <section className="app-reference-view">
        <div className="page-head">
          <div>
            <h2>Pairing marketplace</h2>
            <p>Rank alone never picks the meme. Each proposal carries its own thesis — why this stock, why this meme, why together, why now.</p>
          </div>
          <span className="label">0 proposals this cycle</span>
        </div>
        <div className="app-pairing-focus empty-state" style={{ marginTop: "2rem" }}>
          <span className="label">Pairing marketplace / Status</span>
          <h3>Belum ada pairing yang diusulkan</h3>
          <p>Belum ada proposal pairing yang dihasilkan untuk siklus saat ini.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="app-reference-view">
      <div className="page-head">
        <div>
          <h2>Pairing marketplace</h2>
          <p>Rank alone never picks the meme. Each proposal carries its own thesis — why this stock, why this meme, why together, why now.</p>
        </div>
        <span className="label">{pairings.length} proposals this cycle · sorted by pairing score</span>
      </div>
      <div className="mkt-row">
        {pairings.map((pairing) => (
          <button
            key={pairing.slug}
            type="button"
            className="pcard"
            aria-pressed={pairing.slug === selected.slug}
            onClick={() => setSelectedSlug(pairing.slug)}
          >
            <div className="ptop">
              <span>{pairing.stockSymbol} Stock Token</span>
              <span className="st">{pairing.status.replaceAll("_", " ")}</span>
            </div>
            <div className="pair">
              {pairing.stockSymbol} × {pairing.symbol}
            </div>
            <div className="why">{pairing.thesis.core}</div>
            <div className="sc">
              <span>Pairing score</span>
              <b>{pairing.pairScore}</b>
            </div>
          </button>
        ))}
      </div>
      <Thesis pairing={selected} />
    </section>
  );
}

function Thesis({ pairing }: { pairing: Pairing }) {
  return <div className="thesis" aria-live="polite"><div className="thesis-top"><h3>{pairing.stockSymbol} × {pairing.symbol}</h3><span className="label">Jev pairing <b className="on">{pairing.jevDecision.replaceAll("_", " ")}</b> / conf <b>{pairing.confidence === null ? "—" : `${pairing.confidence}%`}</b></span></div><Question label={`Why ${pairing.stockSymbol}`} copy={pairing.thesis.whyStock} /><Question label="Why this meme" copy={pairing.thesis.whyMeme} /><Question label="Why this pair" copy={pairing.thesis.whyPair} /><Question label="Why now" copy={pairing.thesis.whyNow} /><div className="comps">{pairing.factors.map((factor) => <div className="comp" key={factor.id}><div className="row"><span>{factor.label}</span><b>{factor.score}</b></div><i style={{ "--w": `${factor.score}%` } as CSSProperties} /></div>)}</div>{pairing.alternatives.length ? <div className="alts"><span className="label alt-label">Alternative concepts</span>{pairing.alternatives.map((alternative) => <span className="a" key={alternative.symbol}>{alternative.symbol} <b>{alternative.pairScore}</b></span>)}</div> : null}<div className="thesis-actions"><Link className="btn btn-sm" href={`/pairing/${pairing.slug}`}>Open pairing thesis ↗</Link></div></div>;
}

function Question({ label, copy }: { label: string; copy: string }) { return <div className="qa"><span className="label">{label}</span><p>{copy}</p></div>; }
