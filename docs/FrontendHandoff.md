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

---

## 6. Current Runtime Integration (canonical partial state)

The web client reads worker state when `NEXT_PUBLIC_JEVO_DEMO_MODE=false`. The
verified local runtime configuration is:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_JEVO_DEMO_MODE=false
JEV_MODE=real
PROVIDER_MODE=mock
```

The current data path is:

```text
mock market provider -> BullMQ cycle -> DecisionEngine + RealJevProvider
-> Postgres -> worker REST/SSE -> Zod schemas/adapters
-> TanStack Query -> AppShell and route views
```

Postgres, Redis, BullMQ, REST, SSE, ranking, memory, and the real JEV decision
path are live runtime pieces. Market, narrative/news, social, and stock-token
inputs are still mock provider inputs until `PROVIDER_MODE=real` sources are
selected and verified. `RealJevProvider` uses `typesafe-ai/jev` through AI SDK
`experimental_evaluate`; `AI_GATEWAY_API_KEY` stays server-side. It applies a
bounded timeout/retry policy, validates structured responses, and does not
fall back to `MockJevProvider` in `JEV_MODE=real`. Only structured decisions,
scores, confidence, evidence, provider/model metadata, timestamps, and
observable events are persisted; hidden chain-of-thought is never stored or
rendered.

### Partial-state contract

Pairing and launch are optional outputs of a cycle. Opportunity Rank, the
Opportunity Field, stock detail, decision history, agent status, and memory
render whenever canonical opportunities exist even if `pairings=[]` and
`launches=[]`. Pairing and launch routes show their own truthful empty state;
they never block the rest of the workspace and are never filled from fixtures.
An asset-level JEV/provider failure emits an observable provider-failure event,
leaves that asset unavailable for the cycle, and allows other assets to
continue without fabricated ranking input.

### Route ownership

`/` and `/app` compose agent status, opportunities, memory/cycles, pairings,
and launches from REST/SSE. `/stock/[symbol]` owns canonical opportunity,
decision, signal, trace, and memory data for that symbol. `/pairing` and
`/pairing/[slug]` own pairing data and may be empty. `/launch` and
`/launch/[slug]` own launch data and may be empty. `/memory` owns the memory
ledger independently. `/admin` remains a direct operator route; its existing
panels/mutations are outside the public sidebar and were not redesigned.
Production routes do not request `/api/fixture/*`; fixtures are limited to
explicit demo mode.

### Canonical missing-value rules

Unknown worker values are represented as `null`/`UNAVAILABLE` and rendered as
an existing truthful unavailable state or `—`. The worker does not invent
cycle counters, scheduler deadlines, network metadata, launch stages,
contracts, wallet addresses, activity timestamps, or fallback narrative
metrics. Opaque persisted cycle identifiers remain opaque and are not
converted into synthetic numeric counters.

---

## 7. Interactive Memory Audit & Market Map Visual Hardening

### Interactive `/memory` Workspace
- **Consecutive Steady-State Grouping**: Consecutive cycle records with identical decision, rank, and score are consolidated into a single card to eliminate redundant visual repetition while preserving the exact count and audit window.
- **Audit Detail Drawer**: Grouped cards provide an interactive toggle (`▼ Audit all N individual cycles` / `▲ Collapse raw cycle log`) revealing an embedded monospace table containing all underlying raw cycle records (timestamp, cycle ID, rank, score, decision, and summary).
- **Timeline Milestone Jumping**: Transition and milestone nodes in the chronological timeline strip are clickable (`is-clickable`). Clicking jumps to the corresponding decision card in the right-hand DECISIONS LOG, auto-expands the underlying audit records, smoothly scrolls the viewport, and triggers a temporary glow highlight (`.is-target-highlight`) with a 3.5s timeout.
- **Shared Grouping Utility**: The grouping algorithms and types are extracted to [`web/src/lib/memory/grouping.ts`](file:///Users/fmpangestu/Codingan/WEB3/FIRST%20PROJECT/Jevo/web/src/lib/memory/grouping.ts) (`groupMemoryRecords`, `parseRankAndScore`, `GroupedAuditEntry`).

### Market Map 2D Scatter Label Collision Avoidance
- **Bounding-Box Relaxation**: Located in [`web/src/components/app/views/OverviewView.tsx`](file:///Users/fmpangestu/Codingan/WEB3/FIRST%20PROJECT/Jevo/web/src/components/app/views/OverviewView.tsx) (`computeLabelPlacements`), the scatter plot prevents overlapping label text for tightly clustered coordinates (e.g. AMD, PLTR, COIN, AAPL) without displacing node anchor points.
- **Candidate Evaluation**: Iterates over 10 candidate directional slots around each coordinate, applying penalties for boundary proximity and label collisions, prioritized by opportunity score.
- **Leader Lines**: Renders subtle dashed leader lines (`.field-label-leader`) when offset relaxation exceeds 20px.

### Landing Page Scope & Ownership Correction
- **Ownership Scope**: Codex serves exclusively for auditing / diagnosis. All frontend execution — including the landing page (`/`), app shell, and sub-pages — is owned and implemented directly via AGY CLI. The previous restriction pausing landing page edits is **revoked**.
- **Unified Workspace & Landing Harmony**: Landing page sections 03 (`Stock × meme pairing`) and 04 (`Autonomous pipeline`) now match the visual richness of sections 01, 02, and 05 while preserving the concise teaser context of the public landing page.

---

## 8. Rich Standby Architecture for `/pairing`, `/launch`, and Landing Sections 03/04

### `/pairing` Standby & Governance Architecture
- **Genuinely 0 Proposals State**: Replaces minimal empty notices with an active operational telemetry workspace. Explains that the agent is actively scanning each cycle and waiting for convergence between qualified Stock Tokens and culturally viable meme concepts.
- **Explicit Threshold Criteria**:
  - **Qualification Gate**: Asset rank in Top 3 (`Rank <= 3`) or explicit JEV qualitative decision `PROMOTE`.
  - **Scoring Formula (Synchronized with `worker/src/pairing/evaluate.ts`)**: 6-component deterministic arithmetic model (`computePairingScore`):
    - Narrative Momentum: 20% (`weights.narrative = 0.2`)
    - Meme Concept Attention: 20% (`weights.meme = 0.2`)
    - Cultural Alignment: 15% (`weights.cultural = 0.15`)
    - Crypto Adjacency: 15% (`weights.crypto = 0.15`)
    - Market Timing: 15% (`weights.timing = 0.15`)
    - Stock Relevance: 15% (`weights.stockRelevance = 0.15`)
    - *Note: JEV evaluates the 6 qualitative dimension scores [0–100]; the composite pairing score is blended deterministically using these exact weights.*
  - **Governance Mandate**: Human curation required. Autonomous deployment without human approval is strictly prohibited.
- **Monitored Candidates Table**: Directly reads real opportunity data from the active cycle query, presenting candidate assets (e.g. GME, TSLA, NVDA) with their canonical rank, opportunity score, JEV decision, signal context, and direct link to audit signals (`/stock/[symbol]`).
- **4-Pillar Thesis Blueprint**: Shows the 4 formal thesis questions generated when a match occurs (*Why Stock*, *Why Meme*, *Why Pair*, *Why Now*).
- **Autonomous Pipeline Stepper**: Visual 4-stage pipeline from signal scan to launch queue, highlighting the locked operator curation gate.
- **Distinct `AGENT_PROPOSED` State**: When candidate proposals exist in the database awaiting admin curation, a dedicated governance alert (`🔒 OPERATOR CURATION GATE ACTIVE`) is displayed, distinguishing pending proposals from both the "0 proposals" standby state and approved pairings. Individual proposal cards and the thesis inspector clearly indicate `AWAITING HUMAN OPERATOR REVIEW`.

### `/launch` Standby Lifecycle & Policy Architecture
- **Preserved Explanatory Text**: Retains the canonical explanation ("Launch countdown and checkpoints will activate once a pairing candidate is approved and scheduled by the operator.").
- **Visual 6-Stage Lifecycle Preview**: Renders the complete 6-stage lifecycle strip (`T-24H` to `T-00`: `CANDIDATE_SELECTED`, `NARRATIVE_VALIDATION`, `PAIRING_VALIDATION`, `CONTRACT_PREPARATION`, `FINAL_POLICY_CHECK`, `CONTROLLED_EXECUTION`) in dimmed standby mode, giving operators and users immediate understanding of the launch shape before an active cycle begins.
- **Standby Readout & Scoped Permissions**: Displays a dimmed tabular `STANDBY` readout, protocol facts panel (opportunity score, check counters, asset status, agent wallet, guardian approval, transaction state), and strict permission boundaries (`Agent can` vs `Agent cannot`).
- **8 Pre-Launch Policy Checks Grid**: Renders a dedicated 8-card grid showing all safety gates (Valid Stock Token, Approved Pairing Asset, Token Metadata, Contract Parameters, Launch Limits, Duplicate Check, Agent Permission, Transaction Simulation) in standby verification mode.

---

## 9. Landing Page Sections 03/04 Visual Harmonization & Global English Rule

### Landing Section 03 & 04 Standby Teasers
- **Problem Resolved**: When `featuredPairing` or `launch` was `null` in canonical runtime, sections 03 and 04 rendered bare two-line headers with large blank whitespace voids below and to the right, inconsistent with the visual density of sections 01, 02, and 05.
- **Section 03 (`LandingPairingStandbySection`)**:
  - Live operational telemetry banner with active cycle and threshold indicators (`RANK ≤ 3 OR PROMOTE`).
  - Balanced 2-column grid:
    - **Left Column**: Evaluation architecture gates (Top 3 rank / PROMOTE qualification gate, deterministic 6-dimension formula pills with exact 20%/20%/15%/15%/15%/15% weights, mandatory operator curation gate).
    - **Right Column**: Monitored equity candidates list with live rank badges, opportunity scores, and direct deep-links to `/stock/[symbol]`, plus a 4-pillar thesis blueprint teaser (*Why Stock*, *Why Meme*, *Why Pair*, *Why Now*).
  - Clean footer with direct routing to `/pairing`.
- **Section 04 (`LandingPipelineStandbySection`)**:
  - 6-stage horizontal lifecycle stepper (`CANDIDATE_SELECTED` through `CONTROLLED_EXECUTION` from `T-24H` to `T-00`).
  - Split grid featuring simulated 24h cycle sequence with interactive stage inspection, tabular `STANDBY` clock, pre-launch facts matrix, and scoped permissions (`Agent can` vs `Agent cannot`).
  - Clean footer with direct routing to `/launch`.

### Standing Rule: 100% User-Facing English Across All Routes
- Enforced global English standard across all routes (`/`, `/app`, `/pairing`, `/launch`, `/stock/[symbol]`, `/memory`, `/admin`).
- Translated all legacy Indonesian strings across `/app`, `/pairing`, `/launch`, and `OverviewView`:
  - `PairingsView.tsx`: Standby headers, thresholds, candidate table headers, thesis blueprint questions, pipeline stepper, governance alert badges, and curation banner tags.
  - `LaunchView.tsx`: 8 policy check descriptions, standby readouts, and sequence captions.
  - `OverviewView.tsx`: Section empty states for unpopulated pairings and launches.

### Verification & Visual Artifacts
- **Screenshots Captured**:
  - Before: `docs/screenshots/before_landing_sec03_04.png`, `docs/screenshots/before_landing_sec03.png`, `docs/screenshots/before_landing_sec04.png`, `docs/screenshots/before_pairing.png`, `docs/screenshots/before_launch.png`
  - After: `docs/screenshots/after_landing_sec03.png`, `docs/screenshots/after_landing_sec04.png`, `docs/screenshots/after_pairing.png`, `docs/screenshots/after_launch.png`
- **Build Status**: `bun --filter web lint` (0 errors), `bun --filter web build` (passed, 21 routes compiled cleanly).

---

### Remaining work (priority order)

1. Select and verify real market/provider sources for `PROVIDER_MODE=real`.
2. Add verified narrative/news/social sources and canonical Stock Token data.
3. Run a full real-data cycle and compare persistence, REST, SSE, and UI.
4. Harden production observability and operational runbooks.
5. Implement agent wallet/contracts on testnet only after the read path is
   stable; mainnet execution remains out of scope.

### Do not regress

- Do not add production fixture fallback or realistic-looking defaults.
- Do not make pairing or launch required for opportunity rendering.
- Do not expose hidden model reasoning or API secrets.
- Do not redesign the visual system without an explicit request.
- Do not add autonomous mainnet execution.
- Maintain 100% English user-facing text across all pages.

## NEXT AGENT TASK

The next agent should begin by auditing and selecting the real provider
sources required for `PROVIDER_MODE=real`.

Do NOT start blockchain work yet.


