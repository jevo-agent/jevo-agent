"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";

import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

const STAGES = ["Observe", "Decide", "Rank", "Pair", "Launch"] as const;
const LOOP_MS = 12_000;
const RESUME_MS = 5_000;

type AssetSignal = { symbol: string; sourceY: number; rank?: number; score?: number; delta?: string };
type Lock = { kind: "asset" | "pair" | "stage"; value: string } | null;

const SOURCE_Y = [82, 150, 218, 286, 354, 422, 490] as const;
const rankY: Record<number, number> = { 1: 162, 2: 226, 3: 290, 4: 354, 5: 418 };

interface DecisionPlaneProps {
  asset: Stock;
  assets?: Stock[];
  pairing?: Pairing | null;
  launch?: Launch | null;
}

export function DecisionPlane({ asset, assets, pairing = null, launch = null }: DecisionPlaneProps) {
  const [autoStage, setAutoStage] = useState(0);
  const [hoverAsset, setHoverAsset] = useState<string | null>(null);
  const [hoverPair, setHoverPair] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<number | null>(null);
  const [lock, setLock] = useState<Lock>(null);
  const resumeTimer = useRef<number | null>(null);
  const lastAvailableStage = launch && pairing ? 4 : pairing ? 3 : 2;

  const signals = useMemo<AssetSignal[]>(() => {
    const otherAssets = (assets ?? []).filter((item) => item.symbol !== asset.symbol);
    const slots: Array<Stock | null> = [
      otherAssets[0] ?? null,
      otherAssets[1] ?? null,
      otherAssets[2] ?? null,
      otherAssets[3] ?? null,
      asset,
      otherAssets[4] ?? null,
      otherAssets[5] ?? null,
    ];

    return SOURCE_Y.map((y, index) => {
      const stock = slots[index];
      if (!stock) {
        return {
          symbol: "",
          sourceY: y,
        };
      }
      const delta =
        stock.rankMovement !== null
          ? stock.rankMovement > 0
            ? `+${stock.rankMovement}`
            : stock.rankMovement < 0
              ? `−${Math.abs(stock.rankMovement)}`
              : "—"
          : undefined;

      return {
        symbol: stock.symbol,
        sourceY: y,
        rank: stock.currentRank <= 5 ? stock.currentRank : undefined,
        score: stock.opportunityScore,
        delta,
      };
    });
  }, [asset, assets]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setAutoStage((stage) => stage >= lastAvailableStage ? 0 : stage + 1), LOOP_MS / STAGES.length);
    return () => window.clearInterval(timer);
  }, [lastAvailableStage]);

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

  const activeStage = lock?.kind === "stage" && Number(lock.value) <= lastAvailableStage ? Number(lock.value) : hoverStage ?? Math.min(autoStage, lastAvailableStage);
  const activeAsset = lock?.kind === "asset" ? lock.value : hoverAsset;
  const activePair = pairing ? (lock?.kind === "pair" ? lock.value : hoverPair) : null;
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

  function handlePairKey(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const symbol = event.currentTarget.dataset.pairSymbol;
      if (symbol) setTimedLock({ kind: "pair", value: symbol });
    }
  }

  function handlePairClick(event: MouseEvent<SVGGElement>) {
    event.stopPropagation();
    const symbol = event.currentTarget.dataset.pairSymbol;
    if (symbol) setTimedLock({ kind: "pair", value: symbol });
  }

  function assetClass(symbol: string) {
    const selected = activeAsset === symbol;
    const dimmed = focused && !selected;
    return `plane-asset${selected ? " is-focused" : ""}${dimmed ? " is-dimmed" : ""}`;
  }

  function pairClass(symbol: string) {
    const selected = activePair === symbol;
    const dimmed = focused && !selected;
    return `plane-pair${symbol === pairing?.symbol ? " is-primary" : ""}${selected ? " is-focused" : ""}${dimmed ? " is-dimmed" : ""}`;
  }

  const decision = asset.jevDecision === "UNAVAILABLE" ? "UNAVAILABLE" : asset.jevDecision.replaceAll("_", " ");
  const rankTransition = asset.previousRank === null
    ? `#${String(asset.currentRank).padStart(2, "0")}`
    : `#${String(asset.previousRank).padStart(2, "0")} → #${String(asset.currentRank).padStart(2, "0")}`;
  const pairLabels = pairing
    ? [
        { symbol: pairing.symbol, label: `${pairing.stockSymbol} × ${pairing.symbol}`, detail: `${pairing.pairScore.toFixed(1)} / ${pairing.jevDecision.replaceAll("_", " ")}` },
        ...pairing.alternatives.slice(0, 2).map((alternative) => ({ symbol: alternative.symbol, label: alternative.symbol, detail: `${alternative.pairScore.toFixed(1)} / ALTERNATIVE` })),
      ]
    : [];
  const description = pairing
    ? `Market signals enter from the left, pass through the JEV decision gate, rank into an opportunity list, branch into ${pairing.stockSymbol} × ${pairing.symbol}, and resolve into the launch lane. ${launch ? `Launch state: ${launch.readiness}.` : "No launch candidate this cycle."}`
    : "Market signals enter from the left, pass through the JEV decision gate, rank into an opportunity list, and resolve with no qualified pair or launch candidate this cycle.";

  return (
    <div className={`decision-plane${lock ? " is-locked" : ""}${focused ? " has-focus" : ""}${lock?.kind === "stage" ? " is-stage-locked" : ""}`}>
      <div className="decision-stage-controls" role="group" aria-label="Decision plane stages">
        {STAGES.map((stage, index) => {
          const available = index <= lastAvailableStage;
          const active = activeStage === index;
          return <button key={stage} type="button" className={active ? "is-active" : undefined} disabled={!available} aria-pressed={lock?.kind === "stage" && lock.value === String(index)} onClick={() => setTimedLock({ kind: "stage", value: String(index) })} onMouseEnter={() => setHoverStage(index)} onMouseLeave={() => setHoverStage(null)}>{String(index + 1).padStart(2, "0")} {stage}</button>;
        })}
      </div>

      <svg className="decision-plane-svg" viewBox="0 0 940 560" role="img" aria-labelledby="decision-plane-title decision-plane-description" onClick={() => setTimedLock(null)}>
        <title id="decision-plane-title">JEVO autonomous decision plane</title>
        <desc id="decision-plane-description">{description}</desc>
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
            const isPrimary = signal.symbol === asset.symbol;
            return <path key={`signal-input-${index}`} className={`decision-route signal-route${isPrimary ? " nvda-route nvda-input-route is-primary" : ""}${activeAsset === signal.symbol && signal.symbol ? " is-focused" : ""}${activeAsset && activeAsset !== signal.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M48 ${signal.sourceY} C164 ${signal.sourceY} 250 ${gateY} 348 ${gateY}`} style={{ "--signal-delay": `${index * -0.22}s` } as CSSProperties} />;
          })}
        </g>

        <g className="plane-signal-outputs" aria-hidden="true">
          {signals.filter((signal): signal is AssetSignal & { symbol: string; rank: number } => Boolean(signal.symbol && signal.rank && rankY[signal.rank])).map((signal, index) => {
            const gateY = 280 + (signal.sourceY - 280) * 0.47;
            const rank = rankY[signal.rank];
            const isPrimary = signal.symbol === asset.symbol;
            return <path key={`signal-output-${signal.symbol}`} className={`decision-route signal-route output-route${isPrimary ? " nvda-route nvda-output-route is-primary" : ""}${activeAsset === signal.symbol ? " is-focused" : ""}${activeAsset && activeAsset !== signal.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M372 ${gateY} C430 ${gateY} 452 ${rank} 510 ${rank} L610 ${rank}`} style={{ "--signal-delay": `${(index + signals.length) * -0.22}s` } as CSSProperties} />;
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
          {signals.filter((signal): signal is AssetSignal & { symbol: string; rank: number; score: number } => Boolean(signal.symbol && signal.rank && typeof signal.score === "number" && rankY[signal.rank])).map((signal) => {
            const y = rankY[signal.rank];
            const focusedRank = activeAsset === signal.symbol;
            const isPrimary = signal.symbol === asset.symbol;
            return <g key={`rank-${signal.symbol}`} className={`plane-rank-row${isPrimary ? " is-primary" : ""}${focusedRank ? " is-focused" : ""}${activeAsset && !focusedRank ? " is-dimmed" : ""}`} role="button" tabIndex={0} aria-label={`Focus ${signal.symbol} ranked ${signal.rank}`} aria-pressed={activeAsset === signal.symbol} onClick={(event) => { event.stopPropagation(); setTimedLock({ kind: "asset", value: signal.symbol }); }} onKeyDown={(event) => handleAssetKey(event, signal.symbol)} onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)} onFocus={() => setHoverAsset(signal.symbol)} onBlur={() => setHoverAsset(null)}>
              <text x="510" y={y - 9}>{String(signal.rank).padStart(2, "0")} {signal.symbol} {signal.score.toFixed(1)}</text>
              {isPrimary ? <><text className="plane-accent" x="510" y={y + 16}>JEV / {decision} {rankTransition}{asset.confidence === null ? "" : ` / ${asset.confidence}%`}</text><text className="plane-note" x="510" y={y + 34}>Opportunity / {asset.opportunityScore.toFixed(1)}</text></> : <text className="plane-note" x="510" y={y + 17}>{signal.delta ? `Δ ${signal.delta}` : "—"}</text>}
              <line x1="510" y1={y + 28} x2="684" y2={y + 28} />
            </g>;
          })}
        </g>

        <g className="plane-assets">
          {signals.filter((signal) => Boolean(signal.symbol)).map((signal) => <g key={`asset-${signal.symbol}`} className={`${assetClass(signal.symbol)}${signal.symbol === asset.symbol ? " is-primary" : ""}`} role="button" tabIndex={0} aria-label={`Focus ${signal.symbol} signal path`} aria-pressed={activeAsset === signal.symbol} onClick={(event) => { event.stopPropagation(); setTimedLock({ kind: "asset", value: signal.symbol }); }} onKeyDown={(event) => handleAssetKey(event, signal.symbol)} onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)} onFocus={() => setHoverAsset(signal.symbol)} onBlur={() => setHoverAsset(null)}><text x="48" y={signal.sourceY + 4}>{signal.symbol}</text><circle cx="36" cy={signal.sourceY} r="2.5" /></g>)}
        </g>

        <g className="plane-output-frame" aria-hidden="true">
          <rect x="676" y="48" width="220" height="410" rx="2" />
          <line x1="676" y1="238" x2="896" y2="238" />
          <text x="694" y="68">JEV OUTPUT REGISTER</text>
          <text x="694" y="358">CONTROLLED STATE</text>
        </g>

        {pairing ? <g className="plane-pair-routes">
          <path className={`decision-route pair-route gpu-route${activePair && activePair !== pairing.symbol ? " is-dimmed" : ""}`} pathLength={1} d="M610 162 C660 162 670 88 714 88 L782 88 C820 88 828 120 828 176 L828 246" />
          {pairLabels.slice(1).map((pair, index) => <path key={`pair-route-${pair.symbol}`} className={`decision-route pair-route pair-alt-route${activePair && activePair !== pair.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M610 162 C660 162 678 ${144 + index * 66} 714 ${144 + index * 66}`} />)}
          <path className="decision-route launch-route" pathLength={1} d="M828 246 C828 304 814 354 772 382 L690 382" />
        </g> : null}

        <g className="plane-pair-labels">
          {pairing ? pairLabels.map((pair, index) => <g key={pair.symbol} className={pairClass(pair.symbol)} role="button" tabIndex={0} data-pair-symbol={pair.symbol} aria-label={`Focus ${pair.label} pairing flow`} aria-pressed={activePair === pair.symbol} onClick={handlePairClick} onKeyDown={handlePairKey} onMouseEnter={() => setHoverPair(pair.symbol)} onMouseLeave={() => setHoverPair(null)} onFocus={() => setHoverPair(pair.symbol)} onBlur={() => setHoverPair(null)}><text className={pair.symbol === pairing.symbol ? "plane-pair-symbol selected" : "plane-pair-symbol"} x="714" y={94 + index * 62}>{pair.label}</text><text className="plane-note" x="714" y={111 + index * 62}>{pair.detail}</text></g>) : <g className="plane-pair-empty" aria-label="No qualified pair this cycle"><text className="plane-note" x="714" y="94">PAIR</text><text className="plane-accent" x="714" y="111">NO QUALIFIED PAIR</text><text className="plane-note" x="714" y="128">THIS CYCLE</text></g>}
        </g>

        <g className="plane-launch-label">
          <line x1="690" y1="366" x2="690" y2="454" />
          {launch && pairing ? <><text className="plane-note" x="708" y="388">LAUNCH / {launch.stage.replaceAll("_", " ")}</text><text className="plane-accent" x="708" y="414">{pairing.stockSymbol} × {pairing.symbol}</text><text className="plane-note" x="708" y="438">{launch.readiness} · TX / {launch.transactionState.replaceAll("_", " ")}</text></> : <><text className="plane-note" x="708" y="388">LAUNCH</text><text className="plane-accent" x="708" y="414">NO LAUNCH CANDIDATE</text><text className="plane-note" x="708" y="438">THIS CYCLE</text></>}
        </g>

      </svg>

      <div className="decision-plane-rail" aria-hidden="true"><span>Observe / Stock Tokens</span><span>Jev / Decision Gate</span><span>Pair / <b>{pairing ? `${pairing.stockSymbol} × ${pairing.symbol}` : "No qualified pair"}</b></span><span>Launch / <b>{launch ? launch.transactionState.replaceAll("_", " ") : "No launch candidate"}</b></span></div>
      <span className="decision-plane-lock-status" aria-live="polite">{lock ? `Locked ${lock.kind}: ${lock.value}. Auto emphasis resumes in 5 seconds.` : "Automatic decision sequence active."}</span>
    </div>
  );
}
