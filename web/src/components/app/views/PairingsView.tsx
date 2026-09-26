"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import type { AgentRuntime } from "@/types/agent";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

interface PairingsViewProps {
  pairings: Pairing[];
  assets?: Stock[];
  agent?: AgentRuntime;
}

export function PairingsView({ pairings, assets = [], agent }: PairingsViewProps) {
  const [selectedSlug, setSelectedSlug] = useState(pairings[0]?.slug ?? "");
  const selected = pairings.find((pairing) => pairing.slug === selectedSlug) ?? pairings[0];

  const pendingPairings = pairings.filter(
    (p) => p.status === "AGENT_PROPOSED" || p.curationState === "PENDING"
  );
  const approvedPairings = pairings.filter(
    (p) => p.status === "CURATED" || p.status === "LAUNCH_CANDIDATE" || p.curationState === "APPROVED"
  );

  // When genuinely 0 proposals this cycle:
  if (!selected) {
    const qualifiedAssets = assets.filter(
      (asset) => asset.currentRank <= 3 || asset.jevDecision === "PROMOTE"
    );
    const monitoredAssets = qualifiedAssets.length > 0 ? qualifiedAssets : assets.slice(0, 3);

    return (
      <section className="app-reference-view">
        <div className="page-head">
          <div>
            <h2>Pairing marketplace</h2>
            <p>Rank alone never picks the meme. Each proposal carries its own thesis — why this stock, why this meme, why together, why now.</p>
          </div>
          <span className="label">
            {agent ? `CYCLE ${agent.activeCycle} · ` : ""}0 proposals this cycle · STANDBY SCANNING
          </span>
        </div>

        {/* 01. Operational Standby & Thresholds Architecture */}
        <div className="pairing-standby-banner">
          <div className="pairing-standby-header">
            <div className="pairing-standby-badge">
              <span className="live-dot" aria-hidden="true" />
              <span>JEV EVALUATION ACTIVE · MEME CONVERGENCE STANDBY</span>
            </div>
            <span className="label">THRESHOLD: RANK ≤ 3 OR PROMOTE</span>
          </div>
          <div className="pairing-standby-body">
            <h3>Sistem Aktif Memindai: Menunggu Konvergensi Konsep Meme</h3>
            <p>
              Agen JEV terus memantau pergerakan narasi dan sinyal sosial setiap siklus. Saat ini belum ada proposal pairing yang diterbitkan karena belum ada pasangan Stock Token dan meme coin yang melampaui batas ambang kompatibilitas ganda. Tesis pairing akan otomatis dibuat begitu token meme yang memenuhi kriteria terdeteksi.
            </p>
          </div>
          <div className="pairing-thresholds-grid">
            <div className="pairing-threshold-item">
              <span className="label">01 / AMBANG KUALIFIKASI</span>
              <strong>Peringkat Top 3 / PROMOTE</strong>
              <p>Aset dasar harus menduduki peringkat #01–#03 atau memperoleh keputusan eksplisit PROMOTE dari evaluasi kualitatif JEV.</p>
            </div>
            <div className="pairing-threshold-item">
              <span className="label">02 / FORMULA SKOR PAIRING</span>
              <strong>5 Dimensi Terbobot</strong>
              <p>Resonansi narasi (30%), kesesuaian kultur (25%), kecepatan atensi meme (20%), kedekatan kripto (15%), dan kelayakan struktur (10%).</p>
            </div>
            <div className="pairing-threshold-item">
              <span className="label">03 / GERBANG KURASI ADMIN</span>
              <strong>Persetujuan Manual Wajib</strong>
              <p>Setiap usulan berstatus AGENT_PROPOSED. Agen otonom dilarang meluncurkan token tanpa persetujuan eksplisit operator manusia.</p>
            </div>
          </div>
        </div>

        {/* 02. Monitored Candidates (Aset di Atas Ambang / Sedang Diawasi) */}
        {monitoredAssets.length > 0 && (
          <div className="pairing-monitored-section">
            <div className="plane-meta" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <span className="label">
                <b>KANDIDAT TERPANTAU</b> / {monitoredAssets.length} ASET MEMENUHI AMBANG EVALUASI
              </span>
              <span className="label">STATUS: MENUNGGU PENCARIAN MEME COIN</span>
            </div>
            <div className="pairing-candidate-table-wrap">
              <table className="pairing-candidate-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Stock Token</th>
                    <th>Opportunity Score</th>
                    <th>Jev Decision</th>
                    <th>Signal Context</th>
                    <th>Status Evaluasi</th>
                    <th style={{ textAlign: "right" }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoredAssets.map((asset) => (
                    <tr key={asset.symbol}>
                      <td>
                        <span className="p-rank-badge">#{String(asset.currentRank).padStart(2, "0")}</span>
                      </td>
                      <td>
                        <div className="p-asset-info">
                          <strong className="p-asset-sym">{asset.symbol}</strong>
                          <span className="p-asset-name">{asset.name !== "UNAVAILABLE" ? asset.name : "Stock Token"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="p-score-num">{asset.opportunityScore.toFixed(1)}</span>
                      </td>
                      <td>
                        <span className={`p-dec-badge p-dec-${asset.jevDecision.toLowerCase()}`}>
                          {asset.jevDecision}
                        </span>
                      </td>
                      <td>
                        <span className="p-signal-text">
                          {asset.signals[0]?.label ?? "High relative narrative strength"}
                        </span>
                      </td>
                      <td>
                        <span className="p-status-pill">● Memantau Cocokan Meme</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/stock/${asset.symbol}`} className="p-inspect-link">
                          Audit Sinyal →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 03. 4-Pillar Thesis Blueprint */}
        <div className="pairing-thesis-blueprint">
          <div className="plane-meta" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
            <span className="label"><b>ARSITEKTUR TESIS PAIRING</b> / 4 PERTANYAAN KUNCI JEV</span>
            <span className="label">STRUKTUR FORMAL PROPOSAL</span>
          </div>
          <div className="pairing-pillars-grid">
            <div className="pairing-pillar-card">
              <span className="label">01 / WHY STOCK</span>
              <h4>Mengapa Saham Ini?</h4>
              <p>Momentum pasar riil, volume likuiditas, dan percepatan narasi makro yang sedang mendominasi.</p>
            </div>
            <div className="pairing-pillar-card">
              <span className="label">02 / WHY MEME</span>
              <h4>Mengapa Meme Ini?</h4>
              <p>Daya tarik viral, kedalaman komunitas, kelanggengan kultural, dan kecepatan sentimen on-chain.</p>
            </div>
            <div className="pairing-pillar-card">
              <span className="label">03 / WHY PAIR</span>
              <h4>Mengapa Dipasangkan?</h4>
              <p>Sinergi tematik yang kuat, kohesi naratif, dan potensi refleksivitas antarkomunitas.</p>
            </div>
            <div className="pairing-pillar-card">
              <span className="label">04 / WHY NOW</span>
              <h4>Mengapa Sekarang?</h4>
              <p>Katalis waktu yang mendesak, siklus atensi puncak, dan jendela likuiditas peluncuran.</p>
            </div>
          </div>
        </div>

        {/* 04. Autonomous Lifecycle Pipeline */}
        <div className="pairing-pipeline-stepper">
          <div className="plane-meta" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
            <span className="label"><b>PIPELINE OTONOM MENUJU LAUNCH</b></span>
            <span className="label">TAHAP KURASI MANUSIA DIKUNCI</span>
          </div>
          <div className="pairing-steps-row">
            <div className="p-step is-active">
              <span className="p-step-num">01</span>
              <div className="p-step-content">
                <strong>Pemindaian Sinyal</strong>
                <p>Agen memindai dan menghitung opportunity score aset.</p>
              </div>
            </div>
            <div className="p-step is-current">
              <span className="p-step-num">02</span>
              <div className="p-step-content">
                <strong>Pencocokan Meme (Standby)</strong>
                <p>Mencocokkan konsep meme dengan aset qualified.</p>
              </div>
            </div>
            <div className="p-step">
              <span className="p-step-num">03</span>
              <div className="p-step-content">
                <strong>Kurasi Operator (Terkunci)</strong>
                <p>Verifikasi manual manusia sebelum token dapat dijadwalkan.</p>
              </div>
            </div>
            <div className="p-step">
              <span className="p-step-num">04</span>
              <div className="p-step-content">
                <strong>Antrean Launch</strong>
                <p>Countdown T-24H dan verifikasi 8 policy check.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // When proposals exist (some or all may be AGENT_PROPOSED awaiting review):
  return (
    <section className="app-reference-view">
      <div className="page-head">
        <div>
          <h2>Pairing marketplace</h2>
          <p>Rank alone never picks the meme. Each proposal carries its own thesis — why this stock, why this meme, why together, why now.</p>
        </div>
        <span className="label">
          {pairings.length} proposals this cycle · sorted by pairing score
        </span>
      </div>

      {/* Human-in-the-Loop Governance Notice if there are pending proposals */}
      {pendingPairings.length > 0 && (
        <div className="pairing-governance-notice">
          <div className="gov-icon-badge">🔒 GERBANG KURASI ADMIN AKTIF</div>
          <div className="gov-body">
            <h4>{pendingPairings.length} Proposal Menunggu Tinjauan Operator</h4>
            <p>
              Proposal pairing di bawah dihasilkan secara otonom oleh agen JEV berdasarkan kalkulasi opportunity score dan analisis narasi. Status saat ini adalah <b>AGENT_PROPOSED</b>. Sesuai aturan tata kelola protokol, proposal <b>TIDAK</b> dapat diluncurkan tanpa persetujuan manusia.
            </p>
          </div>
          <div className="gov-counters">
            <span className="gov-pill gov-pill--pending">
              <b>{pendingPairings.length}</b> PENDING REVIEW
            </span>
            {approvedPairings.length > 0 && (
              <span className="gov-pill gov-pill--curated">
                <b>{approvedPairings.length}</b> APPROVED
              </span>
            )}
          </div>
        </div>
      )}

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
              <span className={`st ${pairing.status === "AGENT_PROPOSED" ? "st-pending" : "st-curated"}`}>
                {pairing.status === "AGENT_PROPOSED" ? "● Awaiting Review" : "✓ Approved"}
              </span>
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
  const isPending = pairing.status === "AGENT_PROPOSED" || pairing.curationState === "PENDING";

  return (
    <div className="thesis" aria-live="polite">
      <div className="thesis-top">
        <h3>{pairing.stockSymbol} × {pairing.symbol}</h3>
        <span className="label">
          Jev pairing <b className="on">{pairing.jevDecision.replaceAll("_", " ")}</b> / conf <b>{pairing.confidence === null ? "—" : `${pairing.confidence}%`}</b>
        </span>
      </div>

      <div className="thesis-curation-banner">
        <span className="label">Status Kurasi & Tata Kelola</span>
        <div className="curation-status-row">
          <span className={`curation-badge ${isPending ? "is-pending" : "is-approved"}`}>
            {isPending ? "🔒 PROPOSAL AGEN (MENUNGGU PERSETUJUAN)" : "✓ DISETUJUI UNTUK ANTREAN LAUNCH"}
          </span>
          <span className="curation-actor">
            {isPending
              ? "Autonomous agent proposed · Awaiting human operator review"
              : "Verified by operator · Eligible for launch"}
          </span>
        </div>
      </div>

      <Question label={`Why ${pairing.stockSymbol}`} copy={pairing.thesis.whyStock} />
      <Question label="Why this meme" copy={pairing.thesis.whyMeme} />
      <Question label="Why this pair" copy={pairing.thesis.whyPair} />
      <Question label="Why now" copy={pairing.thesis.whyNow} />

      <div className="comps">
        {pairing.factors.map((factor) => (
          <div className="comp" key={factor.id}>
            <div className="row">
              <span>{factor.label}</span>
              <b>{factor.score}</b>
            </div>
            <i style={{ "--w": `${factor.score}%` } as CSSProperties} />
          </div>
        ))}
      </div>

      {pairing.alternatives.length ? (
        <div className="alts">
          <span className="label alt-label">Alternative concepts</span>
          {pairing.alternatives.map((alternative) => (
            <span className="a" key={alternative.symbol}>
              {alternative.symbol} <b>{alternative.pairScore}</b>
            </span>
          ))}
        </div>
      ) : null}

      <div className="thesis-actions">
        <Link className="btn btn-sm" href={`/pairing/${pairing.slug}`}>
          Open pairing thesis ↗
        </Link>
      </div>
    </div>
  );
}

function Question({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="qa">
      <span className="label">{label}</span>
      <p>{copy}</p>
    </div>
  );
}
