"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

const STAGES = ["Observe", "Decide", "Rank", "Pair", "Launch"] as const;
const LOOP_MS = 12_000;
const RESUME_MS = 5_000;

type AssetSignal = { symbol: string; sourceY: number; rank?: number; score?: number; delta?: string };
type Lock = { kind: "asset" | "pair" | "stage"; value: string } | null;

const signals: AssetSignal[] = [
  { symbol: "AAPL", sourceY: 82, rank: 4, score: 89.4, delta: "+1" },
  { symbol: "AMD", sourceY: 150 },
  { symbol: "COIN", sourceY: 218 },
  { symbol: "GME", sourceY: 286, rank: 5, score: 87.9, delta: "+4" },
  { symbol: "NVDA", sourceY: 354, rank: 1, score: 96.8, delta: "+3" },
  { symbol: "PLTR", sourceY: 422, rank: 3, score: 91.7, delta: "−1" },
  { symbol: "TSLA", sourceY: 490, rank: 2, score: 94.2, delta: "+1" },
];

const rankY: Record<number, number> = { 1: 162, 2: 226, 3: 290, 4: 354, 5: 418 };

interface DecisionPlaneProps {
  asset: Stock;
  pairing: Pairing;
}

export function DecisionPlane({ asset, pairing }: DecisionPlaneProps) {
  const [autoStage, setAutoStage] = useState(0);
  const [hoverAsset, setHoverAsset] = useState<string | null>(null);
  const [hoverPair, setHoverPair] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<number | null>(null);
  const [lock, setLock] = useState<Lock>(null);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setAutoStage((stage) => (stage + 1) % STAGES.length), LOOP_MS / STAGES.length);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
        setLock(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }, []);

  const activeStage = lock?.kind === "stage" ? Number(lock.value) : hoverStage ?? autoStage;
  const activeAsset = lock?.kind === "asset" ? lock.value : hoverAsset;
  const activePair = lock?.kind === "pair" ? lock.value : hoverPair;
  const focused = Boolean(activeAsset || activePair);

  function setTimedLock(nextLock: Lock) {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    setLock(nextLock);
    if (nextLock) {
      resumeTimer.current = window.setTimeout(() => {
        setLock(null);
        resumeTimer.current = null;
      }, RESUME_MS);
    }
  }

  function handleAssetKey(event: KeyboardEvent<SVGGElement>, symbol: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setTimedLock({ kind: "asset", value: symbol });
    }
  }

  function handlePairKey(event: KeyboardEvent<SVGGElement>, symbol: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setTimedLock({ kind: "pair", value: symbol });
    }
  }

  function assetClass(symbol: string) {
    const selected = activeAsset === symbol;
    const dimmed = focused && !selected;
    return `plane-asset${selected ? " is-focused" : ""}${dimmed ? " is-dimmed" : ""}`;
  }

  function pairClass(symbol: string) {
    const selected = activePair === symbol;
    const dimmed = focused && !selected;
    return `plane-pair${symbol === "GPU" ? " is-primary" : ""}${selected ? " is-focused" : ""}${dimmed ? " is-dimmed" : ""}`;
  }

  return (
    <div className={`decision-plane${lock ? " is-locked" : ""}${focused ? " has-focus" : ""}${lock?.kind === "stage" ? " is-stage-locked" : ""}`}>
      <div className="decision-stage-controls" role="group" aria-label="Decision plane stages">
        {STAGES.map((stage, index) => {
          const active = activeStage === index;
          return <button key={stage} type="button" className={active ? "is-active" : undefined} aria-pressed={lock?.kind === "stage" && lock.value === String(index)} onClick={() => setTimedLock({ kind: "stage", value: String(index) })} onMouseEnter={() => setHoverStage(index)} onMouseLeave={() => setHoverStage(null)}>{String(index + 1).padStart(2, "0")} {stage}</button>;
        })}
      </div>

      <svg className="decision-plane-svg" viewBox="0 0 940 560" role="img" aria-labelledby="decision-plane-title decision-plane-description" onClick={() => setTimedLock(null)}>
        <title id="decision-plane-title">JEVO autonomous decision plane</title>
        <desc id="decision-plane-description">Market signals enter from the left, pass through the JEV decision gate, rank into an opportunity list, branch into GPU, CUDA, and COMPUTE pairings, and resolve into the NVDA GPU launch candidate. No transaction is submitted.</desc>
        <g className="plane-guides" aria-hidden="true">
          {[...Array(22)].map((_, index) => <path className="field-trajectory" key={index} pathLength={1} d={`M48 ${48 + index * 23} C180 ${48 + index * 23} 260 ${225 + index * 4.5} 348 ${225 + index * 4.5}`} style={{ "--signal-delay": `${index * -0.65}s` } as CSSProperties} />)}
          <line x1="244" y1="24" x2="244" y2="530" />
          <line x1="392" y1="24" x2="392" y2="530" />
          <line x1="548" y1="24" x2="548" y2="530" />
          <line x1="728" y1="24" x2="728" y2="530" />
        </g>

        <g className="plane-scan" aria-hidden="true">
          <line className="plane-scan-sweep" x1="420" y1="24" x2="420" y2="530" />
        </g>

        <g className="plane-signal-inputs" aria-hidden="true">
          {signals.map((signal, index) => {
            const gateY = 280 + (signal.sourceY - 280) * 0.47;
            return <path key={`signal-input-${signal.symbol}`} className={`decision-route signal-route${signal.symbol === "NVDA" ? " nvda-route nvda-input-route is-primary" : ""}${activeAsset === signal.symbol ? " is-focused" : ""}${activeAsset && activeAsset !== signal.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M48 ${signal.sourceY} C164 ${signal.sourceY} 250 ${gateY} 348 ${gateY}`} style={{ "--signal-delay": `${index * -0.22}s` } as CSSProperties} />;
          })}
        </g>

        <g className="plane-signal-outputs" aria-hidden="true">
          {signals.filter((signal): signal is AssetSignal & { rank: number } => Boolean(signal.rank)).map((signal, index) => {
            const gateY = 280 + (signal.sourceY - 280) * 0.47;
            const rank = rankY[signal.rank];
            return <path key={`signal-output-${signal.symbol}`} className={`decision-route signal-route output-route${signal.symbol === "NVDA" ? " nvda-route nvda-output-route is-primary" : ""}${activeAsset === signal.symbol ? " is-focused" : ""}${activeAsset && activeAsset !== signal.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M372 ${gateY} C430 ${gateY} 452 ${rank} 510 ${rank} L610 ${rank}`} style={{ "--signal-delay": `${(index + signals.length) * -0.22}s` } as CSSProperties} />;
          })}
        </g>

        <g className="plane-signal-marker" aria-hidden="true">
          <circle className="nvda-signal-marker" r="2.2" cx="48" cy="354">
            <animateMotion
              dur="12s"
              repeatCount="indefinite"
              calcMode="linear"
              keyTimes="0;0.22;0.42;0.58;0.74;0.9;1"
              keyPoints="0;0.2;0.33;0.5;0.64;0.82;1"
              path="M48 354 C164 354 250 315 348 315 L372 315 C430 315 452 162 510 162 L610 162 C660 162 670 88 714 88 L782 88 C820 88 828 120 828 176 L828 246 C828 304 814 354 772 382 L690 382"
            />
          </circle>
        </g>

        <rect className={`plane-gate${activeStage === 1 ? " is-active" : ""}`} x="348" y="116" width="24" height="328" rx="1" />
        <path className="nvda-gate-crossing" pathLength={1} d="M348 315 L372 315" aria-hidden="true" />
        <text className={`plane-gate-label${activeStage === 1 ? " is-active" : ""}`} x="348" y="102">JEV</text>
        <text className="plane-note" x="320" y="466">DECISION GATE</text>

        <g className="plane-rank-labels">
          {signals.filter((signal): signal is AssetSignal & { rank: number; score: number; delta: string } => Boolean(signal.rank && signal.score && signal.delta)).map((signal) => {
            const y = rankY[signal.rank];
            const focusedRank = activeAsset === signal.symbol;
            return <g key={`rank-${signal.symbol}`} className={`plane-rank-row${signal.symbol === "NVDA" ? " is-primary" : ""}${focusedRank ? " is-focused" : ""}${activeAsset && !focusedRank ? " is-dimmed" : ""}`} role="button" tabIndex={0} aria-label={`Focus ${signal.symbol} ranked ${signal.rank}`} aria-pressed={activeAsset === signal.symbol} onClick={(event) => { event.stopPropagation(); setTimedLock({ kind: "asset", value: signal.symbol }); }} onKeyDown={(event) => handleAssetKey(event, signal.symbol)} onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)} onFocus={() => setHoverAsset(signal.symbol)} onBlur={() => setHoverAsset(null)}>
              <text x="510" y={y - 9}>{String(signal.rank).padStart(2, "0")} {signal.symbol} {signal.symbol === "NVDA" ? asset.opportunityScore.toFixed(1) : signal.score.toFixed(1)}</text>
              {signal.symbol === "NVDA" ? <><text className="plane-accent" x="510" y={y + 16}>JEV / PROMOTE #04 → #01</text><text className="plane-note" x="510" y={y + 34}>Opportunity / {asset.opportunityScore.toFixed(1)}</text></> : <text className="plane-note" x="510" y={y + 17}>Δ {signal.delta}</text>}
              <line x1="510" y1={y + 28} x2="684" y2={y + 28} />
            </g>;
          })}
        </g>

        <g className="plane-assets">
          {signals.map((signal) => <g key={`asset-${signal.symbol}`} className={`${assetClass(signal.symbol)}${signal.symbol === "NVDA" ? " is-primary" : ""}`} role="button" tabIndex={0} aria-label={`Focus ${signal.symbol} signal path`} aria-pressed={activeAsset === signal.symbol} onClick={(event) => { event.stopPropagation(); setTimedLock({ kind: "asset", value: signal.symbol }); }} onKeyDown={(event) => handleAssetKey(event, signal.symbol)} onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)} onFocus={() => setHoverAsset(signal.symbol)} onBlur={() => setHoverAsset(null)}><text x="48" y={signal.sourceY + 4}>{signal.symbol}</text><circle cx="36" cy={signal.sourceY} r="2.5" /></g>)}
        </g>

        <g className="plane-pair-routes">
          <path className={`decision-route pair-route gpu-route${activePair && activePair !== "GPU" ? " is-dimmed" : ""}`} pathLength={1} d="M610 162 C660 162 670 88 714 88 L782 88 C820 88 828 120 828 176 L828 246" />
          <path className={`decision-route pair-route pair-alt-route${activePair && activePair !== "CUDA" ? " is-dimmed" : ""}`} pathLength={1} d="M610 162 C660 162 678 144 714 144" />
          <path className={`decision-route pair-route pair-alt-route${activePair && activePair !== "COMPUTE" ? " is-dimmed" : ""}`} pathLength={1} d="M610 162 C660 162 678 210 714 210" />
          <path className="decision-route launch-route" pathLength={1} d="M828 246 C828 304 814 354 772 382 L690 382" />
        </g>

        <g className="plane-pair-labels">
          {(["GPU", "CUDA", "COMPUTE"] as const).map((symbol, index) => <g key={symbol} className={pairClass(symbol)} role="button" tabIndex={0} aria-label={`Focus ${symbol} pairing flow`} aria-pressed={activePair === symbol} onClick={(event) => { event.stopPropagation(); setTimedLock({ kind: "pair", value: symbol }); }} onKeyDown={(event) => handlePairKey(event, symbol)} onMouseEnter={() => setHoverPair(symbol)} onMouseLeave={() => setHoverPair(null)} onFocus={() => setHoverPair(symbol)} onBlur={() => setHoverPair(null)}><text className={symbol === "GPU" ? "plane-pair-symbol selected" : "plane-pair-symbol"} x="714" y={94 + index * 62}>${symbol}</text><text className="plane-note" x="714" y={111 + index * 62}>{symbol === "GPU" ? "95.4 / STRONG PAIR" : "alternative route"}</text></g>)}
        </g>

        <g className="plane-launch-label">
          <line x1="690" y1="366" x2="690" y2="454" />
          <text className="plane-note" x="708" y="388">LAUNCH CANDIDATE</text>
          <text className="plane-accent" x="708" y="414">{pairing.stockSymbol} × {pairing.symbol}</text>
          <text className="plane-note" x="708" y="438">T-06 / PREP · TX / NOT SENT</text>
        </g>

      </svg>

      <div className="decision-plane-rail" aria-hidden="true"><span>Observe / Stock Tokens</span><span>Jev / Decision Gate</span><span>Pair / <b>$GPU</b></span><span>Launch / <b>Not submitted</b></span></div>
      <span className="decision-plane-lock-status" aria-live="polite">{lock ? `Locked ${lock.kind}: ${lock.value}. Auto emphasis resumes in 5 seconds.` : "Automatic decision sequence active."}</span>
    </div>
  );
}
