"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";

import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";
import type { Stock } from "@/types/stock";

const STAGES = ["Observe", "Decide", "Rank", "Pair", "Launch"] as const;
const LOOP_MS = 12_000;

type AssetSignal = { symbol: string; sourceY: number; rank?: number; score?: number; delta?: string };

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
  const [autoAssetIndex, setAutoAssetIndex] = useState(0);
  const [hoverAsset, setHoverAsset] = useState<string | null>(null);
  const [hoverPair, setHoverPair] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
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

  const rankedSignals = useMemo(() => {
    return signals.filter((s): s is AssetSignal & { symbol: string; rank: number } =>
      Boolean(s.symbol && s.rank && rankY[s.rank])
    );
  }, [signals]);

  // Auto-cycle through ranked assets sequentially; pause when hovered ("setiap yang di hover dia akan diam")
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (rankedSignals.length <= 1) return;
    if (hoverAsset) return;

    const timer = window.setInterval(() => {
      setAutoAssetIndex((prev) => (prev + 1) % rankedSignals.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [hoverAsset, rankedSignals.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setAutoStage((stage) => stage >= lastAvailableStage ? 0 : stage + 1), LOOP_MS / STAGES.length);
    return () => window.clearInterval(timer);
  }, [lastAvailableStage]);

  // Gate column: scroll-driven shrink — the gate compresses as user scrolls away from hero
  const gateGroupRef = useRef<SVGGElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.getElementById("top");
    if (!hero) return;

    function onScroll() {
      const heroHeight = hero!.offsetHeight;
      const scrolled = window.scrollY;
      // Full gate at scroll=0, collapsed to 0.08 at scroll >= heroHeight
      const t = Math.min(1, Math.max(0, scrolled / (heroHeight * 0.72)));
      const scale = 1 - t * 0.92; // 1.0 → 0.08
      gateGroupRef.current?.style.setProperty("--gate-scroll-scale", String(scale.toFixed(4)));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeStage = hoverStage ?? Math.min(autoStage, lastAvailableStage);
  const activePair = pairing ? hoverPair : null;
  const focused = Boolean(hoverAsset || activePair);

  const effectiveSymbol = hoverAsset || rankedSignals[autoAssetIndex]?.symbol || asset.symbol;
  const selectedSignal =
    signals.find((s) => s.symbol === effectiveSymbol) ||
    signals.find((s) => s.symbol === asset.symbol) ||
    signals[4];

  const activeGateY = selectedSignal ? 280 + (selectedSignal.sourceY - 280) * 0.47 : 315;

  const activeTrajectoryPath = useMemo(() => {
    if (!selectedSignal || !selectedSignal.symbol) return "";
    const sourceY = selectedSignal.sourceY;
    const gateY = 280 + (sourceY - 280) * 0.47;
    const targetY = selectedSignal.rank && rankY[selectedSignal.rank] ? rankY[selectedSignal.rank] : sourceY;

    if (selectedSignal.symbol === asset.symbol && pairing) {
      return `M48 ${sourceY} C164 ${sourceY} 250 ${gateY} 348 ${gateY} L372 ${gateY} C430 ${gateY} 452 ${targetY} 510 ${targetY} L610 ${targetY} C660 ${targetY} 670 88 714 88 L782 88 C820 88 828 120 828 176 L828 246 C828 304 814 354 772 382 L690 382`;
    }
    return `M48 ${sourceY} C164 ${sourceY} 250 ${gateY} 348 ${gateY} L372 ${gateY} C430 ${gateY} 452 ${targetY} 510 ${targetY} L610 ${targetY}`;
  }, [selectedSignal, asset.symbol, pairing]);

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = 940 / rect.width;
    const scaleY = 560 / rect.height;
    const x = Math.round((event.clientX - rect.left) * scaleX);
    const y = Math.round((event.clientY - rect.top) * scaleY);
    if (x >= 0 && x <= 940 && y >= 0 && y <= 560) {
      setCursorPos({ x, y });
    } else {
      setCursorPos(null);
    }
  }

  function assetClass(symbol: string) {
    const selected = effectiveSymbol === symbol;
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
    <div className={`decision-plane${focused ? " has-focus" : ""}`}>
      <div className="decision-stage-controls" role="group" aria-label="Decision plane stages">
        {STAGES.map((stage, index) => {
          const available = index <= lastAvailableStage;
          const active = activeStage === index;
          return <button key={stage} type="button" className={active ? "is-active" : undefined} disabled={!available} onMouseEnter={() => setHoverStage(index)} onMouseLeave={() => setHoverStage(null)}>{String(index + 1).padStart(2, "0")} {stage}</button>;
        })}
      </div>

      <svg
        className="decision-plane-svg"
        viewBox="0 0 940 560"
        role="img"
        aria-labelledby="decision-plane-title decision-plane-description"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCursorPos(null)}
      >
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

        {/* Grounded Autonomous Orbit Field (BRIEF.md Layer A: Observe / Multi-Signal Scanning Universe) */}
        <g className="plane-orbit-field" aria-hidden="true">
          <defs>
            {/* Smooth glowing filter for prominent foreground particle nodes */}
            <filter id="orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradient for Decision Gate aperture column */}
            <linearGradient id="gate-glow-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(2, 198, 165)" stopOpacity="0.04" />
              <stop offset="25%" stopColor="rgb(2, 198, 165)" stopOpacity="0.12" />
              <stop offset="50%" stopColor="rgb(2, 198, 165)" stopOpacity="0.22" />
              <stop offset="75%" stopColor="rgb(2, 198, 165)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="rgb(2, 198, 165)" stopOpacity="0.04" />
            </linearGradient>

            {/* Soft radial aura for interactive cursor hover */}
            <radialGradient id="cursor-aura-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(2, 198, 165)" stopOpacity="0.14" />
              <stop offset="50%" stopColor="rgb(2, 198, 165)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="rgb(2, 198, 165)" stopOpacity="0" />
            </radialGradient>

            {/* Orbit paths: continuous closed orbits around Decision Core (x: 360, y: 280) */}
            <path id="orbit-ring-inner" d="M 285 280 C 285 220, 435 215, 435 280 C 435 345, 285 340, 285 280 Z" />
            <path id="orbit-ring-mid" d="M 220 280 C 220 185, 500 180, 500 280 C 500 380, 220 375, 220 280 Z" />
            <path id="orbit-ring-outer" d="M 170 295 C 170 150, 565 140, 565 275 C 565 410, 170 420, 170 295 Z" />
            <path id="orbit-ring-scanning" d="M 195 315 C 195 125, 740 115, 740 265 C 740 425, 195 445, 195 315 Z" />
            <path id="orbit-ring-counter" d="M 680 285 C 680 155, 250 170, 250 275 C 250 395, 680 415, 680 285 Z" />

            {/* Topographical Wave Contours (Continuous asset scanning streams across market coordinate planes) */}
            <path id="topo-wave-1" d="M 140 110 C 260 55, 380 145, 510 75 C 640 25, 750 115, 890 65" />
            <path id="topo-wave-2" d="M 120 150 C 250 95, 390 195, 530 115 C 660 60, 770 160, 910 110" />
            <path id="topo-wave-3" d="M 110 190 C 240 145, 370 235, 510 160 C 640 100, 760 205, 920 155" />
            <path id="topo-wave-4" d="M 130 235 C 260 190, 400 275, 535 205 C 665 145, 785 245, 905 195" />
            <path id="topo-wave-5" d="M 145 280 C 275 240, 410 320, 545 255 C 675 195, 795 285, 915 245" />
            <path id="topo-wave-6" d="M 135 330 C 270 285, 415 370, 550 305 C 680 250, 800 340, 925 295" />
            <path id="topo-wave-7" d="M 150 380 C 285 330, 425 425, 560 360 C 690 305, 810 400, 930 350" />
            <path id="topo-wave-8" d="M 170 435 C 305 380, 445 475, 580 410 C 705 360, 815 450, 915 405" />
            <path id="topo-wave-9" d="M 190 480 C 330 435, 470 515, 605 460 C 725 415, 825 495, 920 455" />
            <path id="topo-wave-10" d="M 215 525 C 360 485, 490 545, 630 495 C 750 455, 840 520, 930 490" />

            {/* Counter-directional flow paths */}
            <path id="topo-wave-4-rev" d="M 905 195 C 785 245, 665 145, 535 205 C 400 275, 260 190, 130 235" />
            <path id="topo-wave-7-rev" d="M 930 350 C 810 400, 690 305, 560 360 C 425 425, 285 330, 150 380" />
          </defs>

          {/* 1. Dotted Point-Cloud Topography Mesh (Micro-Dots via stroke-dasharray) */}
          <g className="plane-orbit-tracks">
            <path d="M 140 110 C 260 55, 380 145, 510 75 C 640 25, 750 115, 890 65" className="orbit-contour-faint" />
            <path d="M 120 150 C 250 95, 390 195, 530 115 C 660 60, 770 160, 910 110" className="orbit-contour" />
            <path d="M 110 190 C 240 145, 370 235, 510 160 C 640 100, 760 205, 920 155" className="orbit-contour-accent" />
            <path d="M 130 235 C 260 190, 400 275, 535 205 C 665 145, 785 245, 905 195" className="orbit-contour" />
            <path d="M 145 280 C 275 240, 410 320, 545 255 C 675 195, 795 285, 915 245" className="orbit-contour-accent" />
            <path d="M 135 330 C 270 285, 415 370, 550 305 C 680 250, 800 340, 925 295" className="orbit-contour" />
            <path d="M 150 380 C 285 330, 425 425, 560 360 C 690 305, 810 400, 930 350" className="orbit-contour-accent" />
            <path d="M 170 435 C 305 380, 445 475, 580 410 C 705 360, 815 450, 915 405" className="orbit-contour" />
            <path d="M 190 480 C 330 435, 470 515, 605 460 C 725 415, 825 495, 920 455" className="orbit-contour-faint" />
            <path d="M 215 525 C 360 485, 490 545, 630 495 C 750 455, 840 520, 930 490" className="orbit-contour-faint" />

            {/* Inclined orbital rings encircling the JEV Decision Core */}
            <path d="M 285 280 C 285 220, 435 215, 435 280 C 435 345, 285 340, 285 280 Z" className="orbit-contour-accent" />
            <path d="M 220 280 C 220 185, 500 180, 500 280 C 500 380, 220 375, 220 280 Z" className="orbit-contour" />
            <path d="M 170 295 C 170 150, 565 140, 565 275 C 565 410, 170 420, 170 295 Z" className="orbit-contour-accent" />
            <path d="M 195 315 C 195 125, 740 115, 740 265 C 740 425, 195 445, 195 315 Z" className="orbit-contour" />
            <path d="M 680 285 C 680 155, 250 170, 250 275 C 250 395, 680 415, 680 285 Z" className="orbit-contour-faint" />
          </g>

          {/* 3. Autonomous Orbiting & Streaming Micro-Particles (Monitored Asset Signals) */}
          {/* Each particle has a coprime duration and unique phase offset so motion is smooth, asynchronous & organic */}
          <g className="plane-orbit-particles">
            {/* Core Orbit Ring Particles */}
            <circle r="1.8" className="orbit-particle-glow">
              <animateMotion dur="7.3s" repeatCount="indefinite" begin="-1.7s">
                <mpath href="#orbit-ring-inner" />
              </animateMotion>
            </circle>
            <circle r="1.1" className="orbit-particle" opacity="0.45">
              <animateMotion dur="7.3s" repeatCount="indefinite" begin="-5.2s">
                <mpath href="#orbit-ring-inner" />
              </animateMotion>
            </circle>

            <circle r="2.0" className="orbit-particle-glow">
              <animateMotion dur="11.7s" repeatCount="indefinite" begin="-3.4s">
                <mpath href="#orbit-ring-mid" />
              </animateMotion>
            </circle>
            <circle r="1.3" className="orbit-particle" opacity="0.55">
              <animateMotion dur="11.7s" repeatCount="indefinite" begin="-8.6s">
                <mpath href="#orbit-ring-mid" />
              </animateMotion>
            </circle>

            <circle r="2.2" className="orbit-particle-glow">
              <animateMotion dur="17.9s" repeatCount="indefinite" begin="-4.2s">
                <mpath href="#orbit-ring-outer" />
              </animateMotion>
            </circle>
            <circle r="1.4" className="orbit-particle" opacity="0.6">
              <animateMotion dur="17.9s" repeatCount="indefinite" begin="-11.8s">
                <mpath href="#orbit-ring-outer" />
              </animateMotion>
            </circle>
            <circle r="1.0" className="orbit-particle-faint">
              <animateMotion dur="17.9s" repeatCount="indefinite" begin="-15.3s">
                <mpath href="#orbit-ring-outer" />
              </animateMotion>
            </circle>

            <circle r="2.3" className="orbit-particle-glow">
              <animateMotion dur="23.1s" repeatCount="indefinite" begin="-6.5s">
                <mpath href="#orbit-ring-scanning" />
              </animateMotion>
            </circle>
            <circle r="1.5" className="orbit-particle" opacity="0.65">
              <animateMotion dur="23.1s" repeatCount="indefinite" begin="-14.2s">
                <mpath href="#orbit-ring-scanning" />
              </animateMotion>
            </circle>
            <circle r="1.1" className="orbit-particle-faint">
              <animateMotion dur="23.1s" repeatCount="indefinite" begin="-19.7s">
                <mpath href="#orbit-ring-scanning" />
              </animateMotion>
            </circle>

            <circle r="1.7" className="orbit-particle-glow">
              <animateMotion dur="19.3s" repeatCount="indefinite" begin="-7.1s">
                <mpath href="#orbit-ring-counter" />
              </animateMotion>
            </circle>
            <circle r="1.2" className="orbit-particle" opacity="0.5">
              <animateMotion dur="19.3s" repeatCount="indefinite" begin="-16.4s">
                <mpath href="#orbit-ring-counter" />
              </animateMotion>
            </circle>

            {/* Topographic Wave Streaming Particles */}
            <circle r="1.5" className="orbit-particle" opacity="0.7">
              <animateMotion dur="9.7s" repeatCount="indefinite" begin="-2.5s">
                <mpath href="#topo-wave-1" />
              </animateMotion>
            </circle>
            <circle r="1.0" className="orbit-particle-faint">
              <animateMotion dur="9.7s" repeatCount="indefinite" begin="-7.3s">
                <mpath href="#topo-wave-1" />
              </animateMotion>
            </circle>

            <circle r="1.9" className="orbit-particle-glow">
              <animateMotion dur="13.1s" repeatCount="indefinite" begin="-4.8s">
                <mpath href="#topo-wave-2" />
              </animateMotion>
            </circle>
            <circle r="1.2" className="orbit-particle" opacity="0.5">
              <animateMotion dur="13.1s" repeatCount="indefinite" begin="-10.2s">
                <mpath href="#topo-wave-2" />
              </animateMotion>
            </circle>

            <circle r="2.1" className="orbit-particle-glow">
              <animateMotion dur="14.9s" repeatCount="indefinite" begin="-3.1s">
                <mpath href="#topo-wave-3" />
              </animateMotion>
            </circle>
            <circle r="1.3" className="orbit-particle" opacity="0.6">
              <animateMotion dur="14.9s" repeatCount="indefinite" begin="-9.4s">
                <mpath href="#topo-wave-3" />
              </animateMotion>
            </circle>

            <circle r="1.8" className="orbit-particle-glow">
              <animateMotion dur="16.3s" repeatCount="indefinite" begin="-5.9s">
                <mpath href="#topo-wave-4" />
              </animateMotion>
            </circle>
            <circle r="1.1" className="orbit-particle-faint">
              <animateMotion dur="16.3s" repeatCount="indefinite" begin="-12.7s">
                <mpath href="#topo-wave-4" />
              </animateMotion>
            </circle>

            <circle r="2.4" className="orbit-particle-glow">
              <animateMotion dur="12.7s" repeatCount="indefinite" begin="-1.8s">
                <mpath href="#topo-wave-5" />
              </animateMotion>
            </circle>
            <circle r="1.4" className="orbit-particle" opacity="0.65">
              <animateMotion dur="12.7s" repeatCount="indefinite" begin="-7.6s">
                <mpath href="#topo-wave-5" />
              </animateMotion>
            </circle>

            <circle r="1.7" className="orbit-particle" opacity="0.7">
              <animateMotion dur="15.7s" repeatCount="indefinite" begin="-4.4s">
                <mpath href="#topo-wave-6" />
              </animateMotion>
            </circle>
            <circle r="1.2" className="orbit-particle-faint">
              <animateMotion dur="15.7s" repeatCount="indefinite" begin="-11.1s">
                <mpath href="#topo-wave-6" />
              </animateMotion>
            </circle>

            <circle r="2.0" className="orbit-particle-glow">
              <animateMotion dur="18.1s" repeatCount="indefinite" begin="-6.2s">
                <mpath href="#topo-wave-7" />
              </animateMotion>
            </circle>
            <circle r="1.3" className="orbit-particle" opacity="0.55">
              <animateMotion dur="18.1s" repeatCount="indefinite" begin="-13.9s">
                <mpath href="#topo-wave-7" />
              </animateMotion>
            </circle>

            <circle r="1.6" className="orbit-particle" opacity="0.6">
              <animateMotion dur="21.1s" repeatCount="indefinite" begin="-8.3s">
                <mpath href="#topo-wave-8" />
              </animateMotion>
            </circle>
            <circle r="1.1" className="orbit-particle-faint">
              <animateMotion dur="21.1s" repeatCount="indefinite" begin="-16.8s">
                <mpath href="#topo-wave-8" />
              </animateMotion>
            </circle>

            <circle r="1.5" className="orbit-particle" opacity="0.5">
              <animateMotion dur="25.7s" repeatCount="indefinite" begin="-9.7s">
                <mpath href="#topo-wave-9" />
              </animateMotion>
            </circle>

            <circle r="1.4" className="orbit-particle-faint">
              <animateMotion dur="28.3s" repeatCount="indefinite" begin="-15.4s">
                <mpath href="#topo-wave-10" />
              </animateMotion>
            </circle>

            {/* Counter-Flow Particles (Right to Left turbulence) */}
            <circle r="1.9" className="orbit-particle-glow">
              <animateMotion dur="17.1s" repeatCount="indefinite" begin="-3.8s">
                <mpath href="#topo-wave-4-rev" />
              </animateMotion>
            </circle>
            <circle r="1.6" className="orbit-particle-glow">
              <animateMotion dur="20.7s" repeatCount="indefinite" begin="-10.5s">
                <mpath href="#topo-wave-7-rev" />
              </animateMotion>
            </circle>
          </g>
        </g>

        <g className="plane-signal-inputs" aria-hidden="true">
          {signals.map((signal, index) => {
            const gateY = 280 + (signal.sourceY - 280) * 0.47;
            const isSelected = effectiveSymbol === signal.symbol;
            return <path key={`signal-input-${index}`} className={`decision-route signal-route${isSelected ? " is-focused" : ""}${focused && !isSelected ? " is-dimmed" : ""}`} pathLength={1} d={`M48 ${signal.sourceY} C164 ${signal.sourceY} 250 ${gateY} 348 ${gateY}`} style={{ "--signal-delay": `${index * -0.22}s` } as CSSProperties} />;
          })}
        </g>

        <g className="plane-signal-outputs" aria-hidden="true">
          {signals.filter((signal): signal is AssetSignal & { symbol: string; rank: number } => Boolean(signal.symbol && signal.rank && rankY[signal.rank])).map((signal, index) => {
            const gateY = 280 + (signal.sourceY - 280) * 0.47;
            const rank = rankY[signal.rank];
            const isSelected = effectiveSymbol === signal.symbol;
            return <path key={`signal-output-${signal.symbol}`} className={`decision-route signal-route output-route${isSelected ? " is-focused" : ""}${focused && !isSelected ? " is-dimmed" : ""}`} pathLength={1} d={`M372 ${gateY} C430 ${gateY} 452 ${rank} 510 ${rank} L610 ${rank}`} style={{ "--signal-delay": `${(index + signals.length) * -0.22}s` } as CSSProperties} />;
          })}
        </g>

        {/* Dynamic Active Selected Route with progressive 0-100% line draw animation */}
        {activeTrajectoryPath ? (
          <g className="plane-active-route" aria-hidden="true">
            <path
              key={effectiveSymbol}
              className="decision-route active-selected-route"
              pathLength={100}
              d={activeTrajectoryPath}
            />
            <circle key={`marker-${effectiveSymbol}`} className="active-signal-marker" r="3.2">
              <animateMotion
                key={activeTrajectoryPath}
                dur="6.5s"
                repeatCount="indefinite"
                path={activeTrajectoryPath}
              />
            </circle>
          </g>
        ) : null}

        {/* Cybernetic JEV Decision Gate & Containment Aperture */}
        <g
          ref={gateGroupRef}
          className="plane-gate-group"
          aria-hidden="true"
          style={{ "--gate-scroll-scale": "1" } as CSSProperties}
        >
          {/* Containment Column with subtle glow fill */}
          <rect
            className={`plane-gate-column${activeStage === 1 ? " is-active" : ""}`}
            x="346"
            y="96"
            width="28"
            height="360"
            rx="3"
          />

          {/* Caliper brackets top & bottom */}
          <path className="plane-gate-bracket" d="M342 110 L342 94 L378 94 L378 110" />
          <path className="plane-gate-bracket" d="M342 442 L342 458 L378 458 L378 442" />

          {/* Precision calibration tick marks */}
          <line x1="346" y1="162" x2="352" y2="162" className="plane-gate-tick" />
          <text x="341" y="165" textAnchor="end" className="plane-gate-tick-label">0.95</text>

          <line x1="346" y1="226" x2="352" y2="226" className="plane-gate-tick" />
          <text x="341" y="229" textAnchor="end" className="plane-gate-tick-label">0.90</text>

          <line x1="346" y1="280" x2="355" y2="280" className="plane-gate-tick is-threshold" />
          <text x="341" y="283" textAnchor="end" className="plane-gate-tick-label is-threshold">0.85 GATE</text>

          <line x1="346" y1="354" x2="352" y2="354" className="plane-gate-tick" />
          <text x="341" y="357" textAnchor="end" className="plane-gate-tick-label">0.80</text>

          <line x1="346" y1="418" x2="352" y2="418" className="plane-gate-tick" />
          <text x="341" y="421" textAnchor="end" className="plane-gate-tick-label">0.75</text>

          {/* Core vertical scanning laser */}
          <line x1="360" y1="102" x2="360" y2="450" className="plane-gate-laser" />

          {/* Dynamic Active Signal Gate Crossing */}
          <g className="gate-crossing-active" transform={`translate(360, ${activeGateY})`}>
            <line x1="-14" y1="0" x2="14" y2="0" className="gate-crossing-beam" />
            <polygon points="0,-5 5,0 0,5 -5,0" className="gate-crossing-lens" />
            <circle r="1.8" fill="#ffffff" />
          </g>

          {/* Labels */}
          <text className={`plane-gate-title${activeStage === 1 ? " is-active" : ""}`} x="360" y="80" textAnchor="middle">
            JEV DECISION CORE
          </text>
          <text className="plane-note" x="360" y="478" textAnchor="middle">
            DECISION GATE // 0.85 THRESHOLD
          </text>
        </g>

        <g className="plane-rank-labels" aria-hidden="true">
          {signals.filter((signal): signal is AssetSignal & { symbol: string; rank: number; score: number } => Boolean(signal.symbol && signal.rank && typeof signal.score === "number" && rankY[signal.rank])).map((signal) => {
            const y = rankY[signal.rank];
            const focusedRank = effectiveSymbol === signal.symbol;
            const isPrimary = signal.symbol === asset.symbol;
            return <g key={`rank-${signal.symbol}`} className={`plane-rank-row${isPrimary ? " is-primary" : ""}${focusedRank ? " is-focused" : ""}${hoverAsset && !focusedRank ? " is-dimmed" : ""}`} onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)}>
              <text x="510" y={y - 9}>{String(signal.rank).padStart(2, "0")} {signal.symbol} {signal.score.toFixed(1)}</text>
              {focusedRank ? (
                isPrimary ? (
                  <>
                    <text className="plane-accent" x="510" y={y + 16}>JEV / {decision} {rankTransition}{asset.confidence === null ? "" : ` / ${asset.confidence}%`}</text>
                    <text className="plane-note" x="510" y={y + 34}>Opportunity / {asset.opportunityScore.toFixed(1)}</text>
                  </>
                ) : (
                  <>
                    <text className="plane-accent" x="510" y={y + 16}>JEV / ACTIVE EVALUATION #{String(signal.rank).padStart(2, "0")}{signal.delta ? ` · Δ ${signal.delta}` : ""}</text>
                    <text className="plane-note" x="510" y={y + 32}>Opportunity / {signal.score.toFixed(1)}</text>
                  </>
                )
              ) : (
                <text className="plane-note" x="510" y={y + 17}>{signal.delta ? `Δ ${signal.delta}` : "—"}</text>
              )}
              <line x1="510" y1={y + 28} x2="684" y2={y + 28} />
            </g>;
          })}
        </g>

        <g className="plane-assets">
          {signals.filter((signal) => Boolean(signal.symbol)).map((signal) => <g key={`asset-${signal.symbol}`} className={`${assetClass(signal.symbol)}${signal.symbol === asset.symbol ? " is-primary" : ""}`} aria-hidden="true" onMouseEnter={() => setHoverAsset(signal.symbol)} onMouseLeave={() => setHoverAsset(null)}><text x="48" y={signal.sourceY + 4}>{signal.symbol}</text><circle cx="36" cy={signal.sourceY} r="2.5" /></g>)}
        </g>

        {/* High-Precision JEV Output Register (Solid institutional status card) */}
        <g className="plane-output-frame" aria-hidden="true">
          <rect className="output-backdrop" x="676" y="48" width="220" height="410" rx="3" pathLength={1} />
          <rect className="output-header-bar" x="676" y="48" width="220" height="26" rx="3" />
          <circle className="output-status-led" cx="688" cy="61" r="2.8" />
          <text className="output-title" x="698" y="65">JEV OUTPUT REGISTER</text>
          <line x1="676" y1="74" x2="896" y2="74" />
          <line x1="676" y1="238" x2="896" y2="238" />
          <text className="output-subheading" x="694" y="255">CONTROLLED STATE // ACT</text>
        </g>

        {pairing ? <g className="plane-pair-routes">
          <path className={`decision-route pair-route gpu-route${activePair && activePair !== pairing.symbol ? " is-dimmed" : ""}`} pathLength={1} d="M610 162 C660 162 670 88 714 88 L782 88 C820 88 828 120 828 176 L828 246" />
          {pairLabels.slice(1).map((pair, index) => <path key={`pair-route-${pair.symbol}`} className={`decision-route pair-route pair-alt-route${activePair && activePair !== pair.symbol ? " is-dimmed" : ""}`} pathLength={1} d={`M610 162 C660 162 678 ${144 + index * 66} 714 ${144 + index * 66}`} />)}
          <path className="decision-route launch-route" pathLength={1} d="M828 246 C828 304 814 354 772 382 L690 382" />
        </g> : null}

        <g className="plane-pair-labels">
          {pairing ? pairLabels.map((pair, index) => <g key={pair.symbol} className={pairClass(pair.symbol)} aria-hidden="true" onMouseEnter={() => setHoverPair(pair.symbol)} onMouseLeave={() => setHoverPair(null)}><text className={pair.symbol === pairing.symbol ? "plane-pair-symbol selected" : "plane-pair-symbol"} x="714" y={94 + index * 62}>{pair.label}</text><text className="plane-note" x="714" y={111 + index * 62}>{pair.detail}</text></g>) : <g className="plane-pair-empty" aria-label="No qualified pair this cycle"><text className="plane-note" x="714" y="94">PAIR</text><text className="plane-accent" x="714" y="111">NO QUALIFIED PAIR</text><text className="plane-note" x="714" y="128">THIS CYCLE</text></g>}
        </g>

        <g className="plane-launch-label">
          <line x1="690" y1="366" x2="690" y2="454" />
          {launch && pairing ? <><text className="plane-note" x="708" y="388">LAUNCH / {launch.stage.replaceAll("_", " ")}</text><text className="plane-accent" x="708" y="414">{pairing.stockSymbol} × {pairing.symbol}</text><text className="plane-note" x="708" y="438">{launch.readiness} · TX / {launch.transactionState.replaceAll("_", " ")}</text></> : <><text className="plane-note" x="708" y="388">LAUNCH</text><text className="plane-accent" x="708" y="414">NO LAUNCH CANDIDATE</text><text className="plane-note" x="708" y="438">THIS CYCLE</text></>}
        </g>

        {/* Interactive Cursor Reticle (tracks mouse dynamically across decision plane) */}
        {cursorPos ? (
          <g className="plane-cursor-group" aria-hidden="true">
            <circle
              cx={cursorPos.x}
              cy={cursorPos.y}
              r="55"
              className="plane-cursor-aura"
            />
            <line x1={cursorPos.x - 20} y1={cursorPos.y} x2={cursorPos.x - 5} y2={cursorPos.y} className="plane-cursor-cross" />
            <line x1={cursorPos.x + 5} y1={cursorPos.y} x2={cursorPos.x + 20} y2={cursorPos.y} className="plane-cursor-cross" />
            <line x1={cursorPos.x} y1={cursorPos.y - 20} x2={cursorPos.x} y2={cursorPos.y - 5} className="plane-cursor-cross" />
            <line x1={cursorPos.x} y1={cursorPos.y + 5} x2={cursorPos.x} y2={cursorPos.y + 20} className="plane-cursor-cross" />
            <circle cx={cursorPos.x} cy={cursorPos.y} r="12" className="plane-cursor-ring" />
            <circle cx={cursorPos.x} cy={cursorPos.y} r="2.2" className="plane-cursor-dot" />
            <text x={cursorPos.x + 10} y={cursorPos.y - 10} className="plane-cursor-coords">
              {`POS: ${cursorPos.x},${cursorPos.y} // SURVEILLANCE`}
            </text>
          </g>
        ) : null}

      </svg>

      <div className="decision-plane-rail" aria-hidden="true"><span>Observe / Stock Tokens</span><span>Jev / Decision Gate</span><span>Pair / <b>{pairing ? `${pairing.stockSymbol} × ${pairing.symbol}` : "No qualified pair"}</b></span><span>Launch / <b>{launch ? launch.transactionState.replaceAll("_", " ") : "No launch candidate"}</b></span></div>
      <span className="decision-plane-lock-status" aria-live="polite">{hoverAsset ? `Focusing ${hoverAsset} telemetry trajectory.` : "Autonomous decision sequence active."}</span>
    </div>
  );
}
