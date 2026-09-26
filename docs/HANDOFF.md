# JEVO Protocol — Full Stack Status & Development Handoff

**Date**: Sep 26, 2026  
**Repository**: `JEVO` (`web/`, `worker/`, `packages/`, `docs/`)  
**Status**: BACKEND 00–11 Complete, Launch Progression Auto-Advance Active, Frontend Overview Decoupled & Verified.  
**Full Test Suite**: **88 passed, 0 failed** across 12 test files (`worker/`).  
**Frontend Build**: Next.js production build passing (21 routes compiled).

---

## 1. System Overview & Architecture

JEVO is an autonomous quantitative intelligence and token launch agent operating on the Robinhood Chain ecosystem:
1. **Frontend (`web/`)**: Next.js App Router workspace with persistent dark institutional aesthetic (`AppShell`), dynamic Cartesian Opportunity Field, dedicated stock analysis, pairing marketplace, launch telemetry, and agent memory views.
2. **Backend & Worker (`worker/`)**: Unified Fastify API + BullMQ queue workers + Drizzle ORM + PostgreSQL + Redis.
3. **Shared Contracts (`packages/protocol-types/`)**: Shared Zod schemas and TypeScript types defining runtime envelopes, telemetry events, and database models.

---

## 2. BACKEND 11 — Real Jev Provider (Vercel AI Gateway)

### Implementation Summary
- **File**: `worker/src/jev/RealJevProvider.ts`
- **Model**: `typesafe-ai/jev` via Vercel AI SDK Gateway (`experimental_evaluate`)
- **Key Environment Variables**:
  - `JEV_MODE`: Set to `"mock"` by default for fast, deterministic local development and test runs. Set to `"real"` to route evaluations through the live Vercel AI Gateway.
  - `AI_GATEWAY_API_KEY`: Required when `JEV_MODE=real`.

### Critical Technical Patterns & Constraints
1. **TypeSafe Score Rubric Constraint (10 Levels Max)**:
   - TypeSafe AI Gateway strictly limits score questions to a maximum of 10 discrete criteria levels. Passing > 10 levels causes a 400 Bad Request (`TypeSafe Score questions support at most 10 levels`).
   - `SCORE_LEVELS` in `RealJevProvider.ts` is explicitly configured with 10 discrete levels (`1` through `10`).

2. **Raw Score Rescaling (1–10 to 0–100)**:
   - When TypeSafe Jev evaluates score dimensions (`narrativeMomentum`, `culturalRelevance`, `memeCompatibility`, `cryptoAdjacency`, `pairCompatibility`), it returns a rating on the 1–10 decimal scale (e.g. `6.27`).
   - In `RealJevProvider.ts` (`scoreFromAnswer()`), the raw score is rescaled to 0–100 before returning to `DecisionEngine` and Opportunity scoring:
     ```typescript
     function scoreFromAnswer(answer: unknown, questionId: string): number {
       const raw = finiteNumber(asRecord(answer)?.score);
       if (raw === null || raw < 0) {
         throw new RealJevProviderError(
           "INVALID_RESPONSE",
           `Jev response included an invalid score for ${questionId}`,
           false,
         );
       }

       // Rescale raw score from Jev (1-10 scale) to 0-100 before returning to pipeline.
       // Formula: ((score - 1) / 9) * 100, clamped to [0, 100].
       const rescaled = ((raw - 1) / 9) * 100;
       return Math.min(100, Math.max(0, Math.round(rescaled)));
     }
     ```
   - Mathematical verification:
     - Minimum: `raw = 1.0` → `((1 - 1) / 9) * 100 = 0`
     - Midpoint: `raw = 6.27` → `((6.27 - 1) / 9) * 100 = 58.55...` → `59`
     - Maximum: `raw = 10.0` → `((10 - 1) / 9) * 100 = 100`

3. **Field Naming & Primitive Mapping (`boolean` <-> `noul`)**:
   - Vercel AI Gateway / TypeSafe Jev uses `type: "boolean"` for probabilistic binary questions.
   - JEVO's domain interfaces use `evaluateNoul` / `noul`.
   - The mapping is isolated strictly inside `RealJevProvider.ts`:
     ```typescript
     questions: {
       noul: {
         type: "boolean",
         instructions: question,
       },
     }
     ```
   - The outer application never sees the `boolean` naming leaking from the gateway.

4. **Confidence Metadata Extraction**:
   - Extracted directly from `providerMetadata.typesafe.confidence.<key>` (scaled from 0.0–1.0 to 0–100).
   - If metadata is omitted, falls back to answer probability.

5. **Security & Resiliency**:
   - `RealJevProvider` instance does not serialize or log `AI_GATEWAY_API_KEY`.
   - Uses `AbortSignal.timeout(timeoutMs)` and classifies network/timeout/unauthorized errors into `RealJevProviderError` without retry loops on 401s.

---

## 3. Launch Progression Auto-Advance

- **File**: `worker/src/jobs/launchProgression.ts` & `worker/src/jobs/scheduler.ts`
- **Cadence**: BullMQ job running every 60 seconds (`launch-progression-recurring`).
- **Logic**:
  - Checks `launch_cycles` for checkpoints with `status = 'PENDING'` whose `targetTime` has passed.
  - Progression order: `T-24H` (completed upon scheduling) → `T-18H` → `T-12H` → `T-06H` → `T-01H` → `T-00`.
  - Advances stages strictly sequentially (one checkpoint at a time per cycle).
  - Uses atomic single-query SQL updates (`WHERE status = 'PENDING'`) to guarantee safety against concurrent workers.

---

## 4. Frontend Decoupled Gates & Opportunity Field

- **Files**: `web/src/components/app/views/OverviewView.tsx`, `web/src/lib/api/adapters.ts`
- **Decoupled Section Rendering**:
  - The Overview page no longer requires all subsystems (`opportunities`, `pairings`, and `launches`) to be populated simultaneously.
  - Section 01–04 (Opportunity Rank & Cartesian Field) render immediately once `/api/v1/opportunities` returns data.
  - Section 05 (Pairings) displays a dedicated empty state (*"Belum ada pairing yang diusulkan"*) if the array is empty.
  - Section 06 (Launch Readiness) displays a dedicated empty state (*"STANDBY / Belum ada launch aktif"*) if no launch is active.
- **Cartesian Field Coordinates**:
  - **Sumbu X**: `opportunityScore` (0–100) — aligns exactly with the Opportunity Rank table values (`NVDA 89.1`, `GME 86.7`, `TSLA 86.4`, `COIN 85.3`, `PLTR 84.9`, `AMD 81.2`, `AAPL 79.0`).
  - **Sumbu Y**: `narrativeMomentum` (0–100) — qualitative momentum dimension evaluated by Jev (`NVDA 98`, `TSLA 93`, `PLTR 91`, `COIN 90`, `GME 89`, `AMD 88`, `AAPL 86`).
  - Axis labels: `OPPORTUNITY SCORE →` and `NARRATIVE MOMENTUM ↑`.

---

## 5. Verification Commands

### Worker Test Suite
```bash
cd worker
bun test
# Output: 88 pass, 0 fail across 12 files
```

### Type Checking & Build
```bash
# Type check worker:
bun --filter worker typecheck

# Lint & build web frontend:
bun --filter web lint
bun --filter web build
```

### Running Locally
```bash
# Terminal 1: Worker (API + Queue Daemon)
cd worker
bun src/index.ts

# Terminal 2: Web Frontend
cd web
bun dev
```

---

## 3. BACKEND 12 & 13 (narrative half) — Real Alpha Vantage Providers

### Implementation Summary
- **Files**:
  - `worker/src/providers/alphavantage/client.ts`: Shared HTTP client with request pacing (1.25s interval) and in-memory TTL caching.
  - `worker/src/providers/alphavantage/RealMarketDataProvider.ts`: Maps `GLOBAL_QUOTE` to `MarketSnapshot`.
  - `worker/src/providers/alphavantage/RealNarrativeProvider.ts`: Maps `NEWS_SENTIMENT` to `SignalObservation` (`kind: "NEWS"`).
  - `worker/src/providers/index.ts`: Factory toggling via `MARKET_DATA_MODE` and `NARRATIVE_MODE`.
  - `worker/tests/alphaVantage.test.ts`: Unit tests, cache verification, and live smoke test.
- **Key Environment Variables**:
  - `MARKET_DATA_MODE`: Set to `"mock"` by default. Set to `"real"` to fetch live quotes via Alpha Vantage.
  - `NARRATIVE_MODE`: Set to `"mock"` by default. Set to `"real"` to fetch live news/sentiment via Alpha Vantage.
  - `ALPHA_VANTAGE_API_KEY`: Required when `MARKET_DATA_MODE=real` or `NARRATIVE_MODE=real`.
  - `ALPHA_VANTAGE_CACHE_TTL_MS`: In-memory cache TTL (default `21600000` ms = 6 hours).

### Quota Cadence & Rate Limiting Strategy
1. **Free Tier Budget (25 req/day)**:
   - 7 tracked assets (`NVDA`, `TSLA`, `PLTR`, `AAPL`, `GME`, `AMD`, `COIN`).
   - 1 full sweep = 7 market quote requests + 7 narrative news requests = 14 requests total.
   - Leaves 11 requests of headroom for test runs and manual scans.
2. **Burst Limit Protection (1 req/sec)**:
   - Alpha Vantage enforces a strict 1 request per second burst limit.
   - `AlphaVantageClient` implements an asynchronous mutex queue with a minimum 1.25s delay between outbound calls.
3. **Zero-Latency Agent Cycles (60s DELTA)**:
   - 60-second DELTA cycles read from the TTL cache in < 1ms, completely eliminating redundant outbound API calls.

---

## 4. Launch Progression Auto-Advance

- **File**: `worker/src/jobs/launchProgression.ts` & `worker/src/jobs/scheduler.ts`
- **Cadence**: BullMQ job running every 60 seconds (`launch-progression-recurring`).
- **Logic**:
  - Checks `launch_cycles` for checkpoints with `status = 'PENDING'` whose `targetTime` has passed.
  - Progression order: `T-24H` (completed upon scheduling) → `T-18H` → `T-12H` → `T-06H` → `T-01H` → `T-00`.
  - Advances stages strictly sequentially (one checkpoint at a time per cycle).
  - Uses atomic single-query SQL updates (`WHERE status = 'PENDING'`) to guarantee safety against concurrent workers.

---

## 5. Frontend Decoupled Gates & Opportunity Field

- **Files**: `web/src/components/app/views/OverviewView.tsx`, `web/src/lib/api/adapters.ts`
- **Decoupled Section Rendering**:
  - The Overview page no longer requires all subsystems (`opportunities`, `pairings`, and `launches`) to be populated simultaneously.
  - Section 01–04 (Opportunity Rank & Cartesian Field) render immediately once `/api/v1/opportunities` returns data.
  - Section 05 (Pairings) displays a dedicated empty state (*"Belum ada pairing yang diusulkan"*) if the array is empty.
  - Section 06 (Launch Readiness) displays a dedicated empty state (*"STANDBY / Belum ada launch aktif"*) if no launch is active.
- **Cartesian Field Coordinates**:
  - **Sumbu X**: `opportunityScore` (0–100) — aligns exactly with the Opportunity Rank table values (`NVDA 89.1`, `GME 86.7`, `TSLA 86.4`, `COIN 85.3`, `PLTR 84.9`, `AMD 81.2`, `AAPL 79.0`).
  - **Sumbu Y**: `narrativeMomentum` (0–100) — qualitative momentum dimension evaluated by Jev (`NVDA 98`, `TSLA 93`, `PLTR 91`, `COIN 90`, `GME 89`, `AMD 88`, `AAPL 86`).
  - Axis labels: `OPPORTUNITY SCORE →` and `NARRATIVE MOMENTUM ↑`.

---

## 6. Verification Commands

### Worker Test Suite
```bash
cd worker
bun test
```

### Type Checking & Build
```bash
# Type check worker:
bun --filter worker typecheck

# Lint & build web frontend:
bun --filter web lint
bun --filter web build
```

### Running Locally
```bash
# Terminal 1: Worker (API + Queue Daemon)
cd worker
bun src/index.ts

# Terminal 2: Web Frontend
cd web
bun dev
```

---

## 7. Roadmap Status

| Milestone | Description | Status |
|---|---|---|
| BACKEND 00 | Monorepo Setup & Test Harness | Completed |
| BACKEND 01 | Postgres Schema & Drizzle Migrations | Completed |
| BACKEND 02 | Market & Stock Token Provider Adapters | Completed |
| BACKEND 03 | Jev Provider Interface & Mock Engine | Completed |
| BACKEND 04 | Deterministic Opportunity Scoring Engine | Completed |
| BACKEND 05 | Autonomous Agent Cycle Orchestrator | Completed |
| BACKEND 06 | Pairing Thesis Engine | Completed |
| BACKEND 07 | REST API (10 Endpoints) | Completed |
| BACKEND 08 | Realtime SSE Stream & Redis Pub/Sub | Completed |
| BACKEND 09 | Frontend Real-Data Migration | Completed |
| BACKEND 10 | Admin API & Policy Check Controls | Completed |
| Launch Flow | Auto-progression for T-24H..T-00 Checkpoints | Completed |
| BACKEND 11 | Real Jev Adapter via Vercel AI Gateway | Completed |
| BACKEND 12 | Real Market Data Provider via Alpha Vantage | Completed |
| BACKEND 13 | Real Narrative Provider (News half) via Alpha Vantage | Completed |
| BACKEND 14 | Stock Token Canonical Registry Sync | Scheduled |
| Deferred | Blockchain Phase (Solidity, Pons, Signing) | Scheduled for Phase 2 |
