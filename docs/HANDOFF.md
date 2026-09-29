# JEVO Protocol — Full Stack Status & Development Handoff

**Date**: Sep 30, 2026  
**Repository**: `JEVO` (`web/`, `worker/`, `contracts/`, `packages/`, `docs/`)  
**Status**: Robinhood Chain Mainnet Registry Deployed & Verified, 30H Launch Pipeline Active, 15-Asset Universe Monitored, 132/133 Backend Tests Passing.  
**Mainnet Contract**: `0xeBfcBF9675F045095883A199ca4a40D59E873e4d` (Blockscout Verified, Block 75858655)  
**Testnet Contract**: `0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4` (Chain ID 46630)  
**Full Test Suite**: **132 passed, 1 skipped, 0 failed** across 17 test files (`worker/`).  
**Contracts Suite**: **8 passed, 0 failed** (`contracts/` via `forge test`).  
**Frontend Build**: Next.js production build passing (25 routes compiled).

---

## 1. System Overview & Architecture

JEVO is an autonomous quantitative intelligence and token launch agent operating on the Robinhood Chain ecosystem:
1. **Frontend (`web/`)**: Next.js 16 App Router workspace with dark institutional aesthetic (`AppShell`), dynamic Cartesian Opportunity Field, dedicated stock analysis, pairing marketplace, 30h launch telemetry, contract registry, and agent memory views.
2. **Backend & Worker (`worker/`)**: Unified Fastify 5 API + BullMQ queue workers + Drizzle ORM + PostgreSQL 16 + Redis 7 + Viem + Jev DecisionEngine.
3. **Smart Contracts (`contracts/`)**: Solidity 0.8.24 transparency registries deployed to Robinhood Chain Mainnet (`4663`) and Testnet (`46630`).
4. **Shared Types (`packages/protocol-types/`)**: Shared Zod schemas and TypeScript types defining runtime envelopes, telemetry events, and database models.

---

## 2. Infrastructure & Local Dependencies (Mac Restart Guide)

When restarting macOS, Docker containers stop. Follow these steps to restore the full stack:

### Step 1: Start Local PostgreSQL and Redis
The backend depends on PostgreSQL (port 5433) and Redis (port 6380) running via Docker:
```bash
# From repository root:
docker compose -f docker-compose.dev.yml up -d

# Verify containers are healthy:
docker ps
# Expected: jevo-postgres (0.0.0.0:5433->5432) and jevo-redis (0.0.0.0:6380->6379)
```

### Step 2: Database Migration & Seed Verification
If starting with an empty database or verifying state:
```bash
cd worker
bun run db:migrate # Applies drizzle/ migrations (0000 and 0001)
bun run db:seed    # Seeds 15 assets and 11 curated meme concepts
```

### Step 3: Start the Backend Worker
```bash
cd worker
bun src/index.ts
# Alternatively with file-watching: bun run dev
# Worker starts HTTP REST API on http://localhost:4000
```

### Step 4: Start Web Frontend
```bash
cd web
bun dev
# Next.js starts on http://localhost:3000
```

---

## 3. Backend Monitored Asset Universe (15 Assets)

The monitored stock universe has been expanded from 7 to 15 assets in mock/simulation mode. Field `stockTokenAddress` is nullable in schema (`0001_watery_nebula.sql`) to honestly mark unverified tokens at the data layer without fabricating fake addresses:

1. **7 Canonical Verified Robinhood Chain Tokens**:
   - `NVDA`: `0xaf3d76f1834a1d425780943c99ea8a608f8a93f9`
   - `TSLA`: `0x322f0929c4625ed5bad873c95208d54e1c003b2d`
   - `PLTR`: `0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a`
   - `AAPL`: `0xaf3d76f1834a1d425780943c99ea8a608f8a93f9`
   - `GME`: `0x1b0e319c6a659f002271b69db8a7df2f911c153e`
   - `AMD`: `0x86923f96303d656e4aa86d9d42d1e57ad2023fdc`
   - `COIN`: `0x6330d8c3178a418788df01a47479c0ce7ccf450b`
2. **8 Newly Expanded Stocks (Unverified / Null Address)**:
   - `MSFT`, `GOOGL`, `AMZN`, `META`, `AVGO`, `MSTR`, `HOOD`, `SOFI`
   - Data status: `stockTokenAddress = null`
   - Fully calibrated in `fixtures.ts` and `MockJevProvider.ts` with matching narrative magnitudes (92, 90, 89, 94, 91, 96, 88, 85) to preserve the delta skip-gate.

---

## 4. Smart Contracts & Deployment Registry

### Canonical Deployments (`web/src/data/deployments.json`)

| Network | Chain ID | Contract Name | Contract Address | Tx Hash | Blockscout Status |
|---|---|---|---|---|---|
| **Robinhood Mainnet** | `4663` | `JevoPairingRegistry` | `0xeBfcBF9675F045095883A199ca4a40D59E873e4d` | `0x7b98cdb6579cf58e413259a956253d3286bdb057796b937e2f6fd2ba0cae624c` | `SOURCE VERIFIED` (Block 75858655, Solidity 0.8.24, MIT) |
| **Robinhood Testnet** | `46630` | `JevoPairingRegistry` | `0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4` | `0xadeea5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64` | `ON-CHAIN` |

### Scripts & Replay Telemetry
- `scripts/jevo-banner.sh`: Dynamically queries `cast chain-id --rpc-url "$RPC_URL"` and auto-detects whichever network was just used from the newest broadcast file under `contracts/broadcast/Deploy.s.sol/*/run-latest.json`.
- `scripts/jevo-deploy-replay.sh`: Auto-detects the newest `run-latest.json` across all chain-id subfolders.
- Command to run terminal presentation: `npm run deploy:show`.

---

## 5. Backend Runtime & Agent Cycle Pipeline

Every agent cycle executes the following 16-step sequence:
1. **TX1 Formal Cycle Minting**: Persists record in `agent_cycles` (`status='RUNNING'`).
2. **Step 2 Universe Acquisition**: Loads active stock assets from `assets` table.
3. **Step 3 Observation Collection**: Queries market data, narrative signals, and social velocity.
4. **Step 4 Hash Comparison**: Checks observation hashes against prior cycle.
5. **Step 5-6 Skip Gate**: Skips expensive LLM calls if observations are unchanged (`deltaNarrative <= 0.001`), carrying forward prior decisions.
6. **Step 7 Jev Decision Evaluation**: Calls `evaluateChoice` and `evaluateScore` for changed assets.
7. **Step 8-13 Opportunity Scoring & Ranking**: Deterministic weighting formula persists scores in `opportunity_scores` and ranks in `rank_history`.
8. **Step 14-15 Pairing Pass**: Checks top-ranked assets against `curated_meme_concepts` and stores candidates in `pairing_candidates` (`lifecycle_state='PROPOSED'`).
9. **Step 16 Cycle Completion**: Updates `agent_cycles` (`status='COMPLETED'`), logs duration and signals processed.

---

## 6. REST API Endpoints (Port 4000)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/agent/status` | GET | Current agent runtime status, active cycle, scan state |
| `/api/v1/opportunities` | GET | Ranked opportunities list with query filter/sort |
| `/api/v1/stocks/:symbol` | GET | Comprehensive stock intelligence, rank history, open pairings |
| `/api/v1/pairings` | GET | Approved and proposed pairing candidates |
| `/api/v1/pairings/:id` | GET | Specific pairing candidate thesis and component radar |
| `/api/v1/launches` | GET | Active and pending launch progression candidates |
| `/api/v1/launches/:id` | GET | Detailed 30-hour launch checklist and timeline |
| `/api/v1/memory` | GET | Immutable memory events and observation deltas |
| `/api/v1/cycles` | GET | Completed agent cycles audit history |
| `/api/v1/events` | GET | Protocol events stream (SSE fallback & polling) |

---

## 7. Verification & CLI Health Checks

```bash
# 1. Verify Docker containers are up:
docker ps

# 2. Run backend test suite (132 passed, 1 skipped):
cd worker && bun test --concurrency=1

# 3. TypeScript typecheck:
cd worker && bun run typecheck

# 4. Smart contracts test suite (8 passed):
cd contracts && forge test

# 5. Frontend test / build:
cd web && bun run build
```
