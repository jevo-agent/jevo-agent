# JEVO Frontend Workspace Architecture & Opportunity Handoff

**Date**: Sep 26, 2026  
**Target Audience**: Codex / Next Developer / Agent Continuation  
**Repository Working Directory**: `/` (Monorepo root: `web/`, `worker/`, `packages/`, `docs/`)  
**Status**: All current frontend tasks, shell unifications, stock workspace embedding, sidebar active states, and Opportunity Field quantitative chart overhauls are **completed and verified**.  
**Build Health**: `bun --filter web lint` (0 errors), `bun --filter web build` (passed, 21 routes compiled).

---

## 1. Executive Summary

This handoff documents the completed architectural unification of the JEVO web frontend (`web/`) and outlines clear continuation tasks for Codex.

The frontend has been upgraded from disconnected standalone pages to a **single cohesive quantitative operating workspace**:
1. **Unified Shell Across All Routes**: `/app`, `/stock/[symbol]`, `/pairing`, `/pairing/[slug]`, `/launch`, `/launch/[slug]`, `/memory`, and `/admin` now all live inside `AppShell` with consistent layout, gutters, typography, and dark institutional aesthetic.
2. **Persistent Sidebar & Active Nav State**: The sidebar accurately marks `Opportunities` as active when viewing `/stock/[symbol]` or scrolling through the Opportunity workspace on `/app`.
3. **Opportunity Field Rebuilt as a Quantitative Institutional Chart**: Replaced the previously clustered, empty-looking box with a rich 2D Cartesian market plane complete with visible scale numbers (`70, 75, 80, 85, 90, 95, 100`), 4 distinct market quadrants, dynamic crosshair projections, JEV qualification boundary curve, active state transition vectors, and a 24-cycle telemetry trajectory mini-chart.

---

## 2. Key Architecture & File Structure

```
Jevo/
├── docs/
│   ├── BRIEF.md                    # Core protocol brief
│   ├── BackendHandoff.md           # Backend BullMQ, scanner, Jev logic specifications
│   └── FrontendHandoff.md          # THIS FILE - Frontend state & continuation guide
├── packages/
│   └── protocol-types/             # Shared TypeScript schemas (Zod, frontend types)
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Global tokens, typography, chart styles, animations
│   │   │   ├── layout.tsx          # Root layout with fonts, providers, metadata
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── app/page.tsx        # Main /app overview workspace
│   │   │   ├── stock/[symbol]/     # Stock detail page (now inside AppShell)
│   │   │   ├── pairing/            # Pairing marketplace & detail
│   │   │   ├── launch/             # Launch queue & telemetry
│   │   │   ├── memory/             # Agent memory & decision ledger
│   │   │   └── admin/              # Agent administrative controls
│   │   ├── components/
│   │   │   ├── app/
│   │   │   │   ├── AppShell.tsx    # Workspace shell wrapper
│   │   │   │   ├── AppSidebar.tsx  # Dynamic nav with effectiveSection detection
│   │   │   │   ├── AppTopbar.tsx   # Sticky header, chain telemetry, epoch pill
│   │   │   │   ├── EventSourceProvider.tsx # Real-time SSE listener with fallback
│   │   │   │   └── views/
│   │   │   │       └── OverviewView.tsx # Overview, Opportunity Field, Rank, Trace
│   │   │   ├── stock/              # Stock workspace components (StockHeader, etc.)
│   │   │   └── landing/            # Landing page components
│   │   └── data/
│   │       └── mock-agent-state.ts # Canonical mock fixtures & baseline telemetry
```

---

## 3. What Was Implemented

### A. App Navigation & Active Section Logic (`AppSidebar.tsx`)
- **Location**: `web/src/components/app/AppSidebar.tsx`
- **Mechanism**:
  - Implemented `effectiveSection` logic that checks:
    1. Explicit `activeSection` prop passed from page shells (e.g. `/stock/[symbol]` explicitly passes `"opportunities"`).
    2. Pathname pattern matching:
       - `pathname.startsWith("/stock/")` → `"opportunities"`
       - `pathname.startsWith("/pairing")` → `"pairings"`
       - `pathname.startsWith("/launch")` → `"launch"`
       - `pathname.startsWith("/memory")` → `"memory"`
    3. Falls back to `activeSection` determined by `IntersectionObserver` on `/app`.
  - Removed strict `appPage &&` conditional so the `.is-active` class (teal bar + background glow) illuminates correctly across standalone routes.
  - Deep-link URLs updated to route seamlessly to `/app#opportunities`, `/pairing`, `/launch`, etc.

### B. Stock Detail Workspace Integration (`/stock/[symbol]`)
- **Location**: `web/src/app/stock/[symbol]/page.tsx`
- **Mechanism**:
  - Encapsulated inside `AppShell` with `activeSection="opportunities"` and `appPage={false}`.
  - Retains full desktop and mobile sidebar integration.
  - Consistent header breadcrumbs: `JEVO / OPPORTUNITIES / [SYMBOL]`.
  - Preserves back-navigation directly to `/app#opportunities`.

### C. Opportunity Field Visual Overhaul (`OverviewView.tsx`)
- **Location**: `web/src/components/app/views/OverviewView.tsx` & `web/src/app/globals.css`
- **Features Implemented**:
  1. **Quantitative Scales & Tick Marks**:
     - Both X (Opportunity Score: 0–100) and Y (Narrative Momentum: 0–100) feature visible numerical scale labels at 5-point intervals (`70, 75, 80, 85, 90, 95, 100`).
     - Tick marks with styling `.field-tick` and text `.field-scale-text`.
     - Explicit directional axis titles: `OPPORTUNITY SCORE →` and `NARRATIVE MOMENTUM ↑`.
  2. **Four Market Quadrants**:
     - `Q1: EXPEDITE (PAIRABLE & HIGH NARRATIVE)` — highlighted top-right zone with teal tint.
     - `Q2: VOLATILITY / MEME` — top-left quadrant (e.g., GME).
     - `Q3: MONITOR / BASELINE` — bottom-left quadrant (e.g., COIN).
     - `Q4: EMERGING MOMENTUM` — bottom-right quadrant (e.g., AMD).
  3. **JEV Qualification Frontier**:
     - Glowing curved threshold curve indicating `SCORE ≥ 90.0` eligibility boundary, rendered dynamically relative to real domain bounds.
  4. **Dynamic Canonical Coordinate Derivation (`getAssetCoordinates`)**:
     - Coordinates derived dynamically from the canonical data source (no hardcoded symbol coordinates):
       - **Sumbu X (Opportunity Score)**: Reads the exact `opportunityScore` from the same `/opportunities` data source driving the Opportunity Rank table. E.g. `NVDA`: 89.1, `GME`: 86.7, `TSLA`: 86.4, `COIN`: 85.3, `PLTR`: 84.9, `AMD`: 81.2, `AAPL`: 79.0.
       - **Sumbu Y (Narrative Momentum)**: Reads the raw `narrativeMomentum` dimension directly from `score.narrativeMomentum` in `/opportunities` (and `/stocks/:symbol`). E.g. `NVDA`: 98.0, `TSLA`: 93.0, `PLTR`: 91.0, `COIN`: 90.0, `GME`: 89.0, `AMD`: 88.0, `AAPL`: 86.0.
     - Dynamic Cartesian domain bounds (`minX`, `maxX`, `minY`, `maxY`) scale naturally with asset distribution.
  5. **Dynamic Crosshair Projections**:
     - Dashed projection lines to X and Y axes when an asset is hovered or selected.
     - Interactive badge pills showing exact coordinate values (e.g. `[ X: 89.1 ]`, `[ Y: 98.0 ]`).
  6. **Active State Transition Vector**:
     - Historical progression indicator for the active node (`PREV #04 (89.1)` → vector line → `JEV EVAL: PROMOTE (94% CONF)` badge with Jevo logo).
  7. **24-Cycle Telemetry Trajectory Mini-Chart**:
     - A dedicated telemetry panel below the 2D field rendering SVG historical score progression over the last 24 cycles (`84.2 → 87.1 → 90.4 → 89.1`) with line and data point tags.

### D. Decoupled Section Gates & Granular Empty States
- **Location**: `web/src/lib/api/adapters.ts`, `OverviewView.tsx`, `LaunchView.tsx`, `PairingsView.tsx`
- **Mechanism**:
  - Eliminated the full-page blocker `if (!featuredAsset || !featuredPairing || !launch) return null;`.
  - Full-page blocker only triggers if `opportunities` fails or returns empty array.
  - If backend returns opportunities but pairings or launches are currently unpopulated (`[]`), each subsystem displays a clean section-level empty state:
    - **Section 05 (Pairings)**: Shows *"Belum ada pairing yang diusulkan"* when `pairings.length === 0`.
    - **Section 06 (Launch Readiness)**: Shows *"STANDBY / Belum ada launch aktif"* when `launch` is null.
    - Standalone `/launch` and `/pairing` pages render dedicated reference-view empty states gracefully.

---

## 4. Verification & Health Check

### Commands to Run
```bash
# Run linting across the monorepo web package:
bun --filter web lint

# Verify Next.js production build:
bun --filter web build

# Start local dev server (default port 3000):
bun dev --filter web
```

### Visual Verification Status
- Screen captures taken and verified:
  - `new_opportunity_field_chart_*.png`: Full Opportunity Field with scales, quadrants, active sidebar nav item.
  - `stock_nvda_active_nav_*.png`: `/stock/NVDA` page with active Opportunities item.
  - `hover_tsla_crosshairs_*.png`: Dynamic hover crosshairs on TSLA.

---

## 5. Codex Action Items / Next Tasks

When continuing work on JEVO, here are the prioritized next steps:

### Task 1: Realtime SSE Stream & TanStack Cache Invalidation
- **Current Status**:
  - `web/src/components/app/EventSourceProvider.tsx` is already implemented and mounted in root `providers.tsx` (commit `b755d7c`).
  - Subscribes to `/events/stream` via native `EventSource` (with automatic fallback to 8s cursor polling on `/events?since=<cursor>` if SSE fails).
  - Handles 12 named protocol events (`AGENT_SCAN_STARTED`, `ASSET_ANALYZED`, `JEV_DECISION_COMPLETED`, `ASSET_PROMOTED`, `ASSET_DEMOTED`, `RANKING_UPDATED`, `CYCLE_COMPLETED`, `CYCLE_FAILED`, `PAIRING_PROPOSED`, `PAIRING_UPDATED`, `LAUNCH_SELECTED`, `LAUNCH_STAGE_ADVANCED`, `COUNTDOWN_STARTED`) and invalidates exact query keys (`["agent-status"]`, `["opportunities"]`, `["pairings"]`, `["launches"]`, `["cycles"]`, `["stock", symbol]`).
- **Remaining Work Required**:
  - Verify view-level animation: when a scanner cycle completes and TanStack Query refetches `/opportunities`, ensure the active node on the Opportunity Field transitions smoothly to its new coordinates without layout flicker.

### Task 2: Refine Pairing & Autonomous Launch Workspace Pages
- **Context**: The `/pairing` and `/launch` pages already load inside the workspace shell.
- **Work Required**:
  - Audit `/pairing/[slug]` and `/launch/[slug]` to ensure all telemetry feeds, T-24H countdown timers, and simulation steps conform to the same dark institutional aesthetic and tabular monospace format.

### Task 3: Mobile Touch Interactivity on Opportunity Field
- **Context**: The desktop Opportunity Field features rich hover and click crosshairs.
- **Work Required**:
  - On mobile (`< 768px`), ensure tap-to-select cleanly triggers the `DecisionInspector` bottom drawer without causing accidental scroll or viewport shift.

---

*Handoff written and verified on Sep 26, 2026.*
