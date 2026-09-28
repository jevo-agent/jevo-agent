# DESIGN LOCK — Hero Section / DecisionPlane

> **Status: LOCKED — DO NOT REDESIGN**
> Last confirmed by user: 2026-09-28
> Commit baseline: `2a7adfb` (feat: gate column entry animation + scroll-driven shrink)

---

## Scope of Lock

The following files are **design-frozen**. Agents MAY fix bugs, data-binding regressions,
or build errors. Agents MUST NOT redesign, restructure, or remove visual elements.

| File | Locked Scope |
|------|-------------|
| `web/src/components/landing/DecisionPlane.tsx` | **ENTIRE FILE** |
| `web/src/app/globals.css` — lines `.landing-root .hero` → `.landing-root .plane-*` | Hero + DecisionPlane visual rules |

---

## Approved Visual Contract (DO NOT CHANGE)

### Hero Right Side — DecisionPlane SVG

1. **Orbit field** — Topo-wave paths with `animateMotion` particles flowing independently.
   - Each particle has a unique duration + begin offset for organic, non-synchronized motion.
   - Counter-flow particles exist (right-to-left).

2. **Gate column** — Tall vertical rect `x=346 y=96 width=28 height=360`.
   - **Entry animation**: `gate-column-enter` — `scaleY(0.05) → scaleY(1)` spring `cubic-bezier(0.34, 1.42, 0.64, 1)` 1.1s.
   - **Scroll shrink**: JS scroll listener drives `--gate-scroll-scale` CSS var → `scaleY` on `plane-gate-group`.
   - Caliper brackets (U-caps top/bottom) and scanning laser animate with same entry keyframe.

3. **Signal routes (input + output)** — S-curve paths from asset source → gate → rank output.
   - `pathLength={1}` on all route paths.
   - **Flow-in animation**: `signal-flow-in` — `stroke-dashoffset: 1 → 0` left-to-right draw, 1.2s.
   - Staggered via `--signal-delay` CSS custom property per path.
   - After draw completes, ambient drift loop resumes.

4. **Active selected route** — Highlighted S-curve for the auto-cycled / hovered asset.
   - `key={effectiveSymbol}` forces React remount on asset switch → CSS animation resets.
   - `route-draw`: `stroke-dashoffset: 100 → 0`, 0.85s `cubic-bezier(0.4, 0, 0.2, 1)`.
   - Auto-cycles through ranked assets every 3800ms; pauses on `hoverAsset`.

5. **Output Register panel** (right-side terminal card).
   - Solid dark backdrop `rgb(6 14 12 / 96%)` with accent border.
   - **Border trace animation**: `output-border-trace` — border draws clockwise around perimeter, 1.6s, 0.4s delay.
   - `pathLength={1}` on backdrop rect enables the `stroke-dashoffset` trace.
   - Header bar, LED pulse, rank labels, pair info — all from canonical API data.

6. **Cursor reticle** — Tracks real mouse position inside SVG via `onMouseMove`.
   - Rotating dashed ring, crosshair, `POS: X,Y // SURVEILLANCE` coords.

7. **Auto-cycle + hover-pause** — No `role="button"`, no click handlers, no `cursor: pointer` on ranks/assets/pairs.

### Canonicality Rule (HARD)
- ALL labels, symbols, ranks, scores visible in DecisionPlane MUST come from the canonical API.
- NO hardcoded asset symbols, scores, or ranks in production paths.
- Purely decorative elements (orbit particles, grid lines, gate geometry) may be geometric constants.

---

## What Agents Are Allowed To Do

- ✅ Fix TypeScript / lint / build errors
- ✅ Fix data-binding regressions (re-hardcoding is NOT a fix)
- ✅ Update canonical field mappings if the API schema changes
- ✅ Add new *sections* below the hero (OpportunitySection, PairingSection, etc.)

## What Agents Must NOT Do

- ❌ Remove or replace the DecisionPlane SVG component
- ❌ Replace the orbit field with a different animation system
- ❌ Remove the gate column, caliper brackets, or laser
- ❌ Remove the scroll-driven gate shrink
- ❌ Remove the signal route flow-in animation
- ❌ Remove the output-border-trace animation
- ❌ Change `cursor: pointer` back on rank rows / asset labels / pair labels
- ❌ Re-introduce click handlers / `role="button"` on non-interactive SVG elements
- ❌ Substitute hardcoded asset symbols (NVDA, TSLA, etc.) as display values
- ❌ Add a fake `0.65` confidence fallback or fabricated memory duration

---

> Any agent that receives this file MUST read and respect these constraints before
> touching any file listed in the Scope of Lock above.
