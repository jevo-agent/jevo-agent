# JEVO Protocol — Full Stack Status & Development Handoff

**Date**: Sep 30, 2026  
**Repository**: `JEVO` (`web/`, `worker/`, `contracts/`, `packages/`, `docs/`)  
**Status**: Robinhood Chain Mainnet Registry Deployed & Verified, 30H Launch Pipeline Active, Protocol Economics Live, Frontend Next.js Production Build Passing.  
**Mainnet Contract**: `0xeBfcBF9675F045095883A199ca4a40D59E873e4d` (Blockscout Verified, Block 75858655)  
**Testnet Contract**: `0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4` (Chain ID 46630)  
**Full Test Suite**: **88 passed, 0 failed** across 12 test files (`worker/`).  
**Frontend Build**: Next.js production build passing (25 routes compiled).

---

## 1. System Overview & Architecture

JEVO is an autonomous quantitative intelligence and token launch agent operating on the Robinhood Chain ecosystem:
1. **Frontend (`web/`)**: Next.js 16 App Router workspace with persistent dark institutional aesthetic (`AppShell`), dynamic Cartesian Opportunity Field, dedicated stock analysis, pairing marketplace, 30h launch telemetry, contract registry, and agent memory views.
2. **Backend & Worker (`worker/`)**: Unified Fastify API + BullMQ queue workers + Drizzle ORM + PostgreSQL + Redis.
3. **Smart Contracts (`contracts/`)**: Solidity 0.8.24 transparency registries deployed to Robinhood Chain Mainnet and Testnet.
4. **Shared Types (`packages/protocol-types/`)**: Shared Zod schemas and TypeScript types defining runtime envelopes, telemetry events, and database models.

---

## 2. Smart Contracts & Deployment Registry

### A. Canonical Deployments (`web/src/data/deployments.json`)
The public contract registry displays verified deployments on Robinhood Chain with automated on-chain explorer health checks (`/api/contracts/check`):

| Network | Chain ID | Contract Name | Contract Address | Tx Hash | Blockscout Status |
|---|---|---|---|---|---|
| **Robinhood Mainnet** | `4663` | `JevoPairingRegistry` | `0xeBfcBF9675F045095883A199ca4a40D59E873e4d` | `0x7b98cdb6579cf58e413259a956253d3286bdb057796b937e2f6fd2ba0cae624c` | `SOURCE VERIFIED` (Block 75858655, Solidity 0.8.24, MIT) |
| **Robinhood Testnet** | `46630` | `JevoPairingRegistry` | `0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4` | `0xadeea5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64` | `ON-CHAIN` |

*Note: The earlier mainnet deployment (`0x7Ae1dfdA49EcbcbaF4816341C63AEE909dD92EbD`), which had a stale doc-comment bug on Blockscout, has been completely superseded and excluded from all registries and application code.*

### B. Planned Contract Architecture (`/contracts` Planned Tab)
All 9 planned protocol execution contracts are cataloged under the `PLANNED · NOT DEPLOYED` phase:
1. **JEVO Agent Registry**: Canonical agent identity and protocol permission register (`BRIEF.md §23`).
2. **JEVO Policy Controller**: Rule validation engine for autonomous cycle and launch constraints (`BRIEF.md §23, BackendHandoff §21`).
3. **JEVO Launch Executor**: Execution engine for authorized token pairings and liquidity creation (`BRIEF.md §23, BackendHandoff §21`).
4. **Token Factory**: ERC-20 paired token creation and initial distribution contract (`BRIEF.md §23, BackendHandoff §21`).
5. **Launch Adapter**: Intermediary bridge for parameter formatting and execution staging (`BRIEF.md §23`).
6. **Pons Adapter**: Integration interface for Pons custom pair market and liquidity bootstrapping (`BRIEF.md §23, §24`).
7. **Emergency Pause / Guardian**: Multi-signature fail-safe and circuit breaker contract (`BRIEF.md §23`).
8. **Event Logger**: Immutable audit trail emitter for on-chain state transitions (`BRIEF.md §23`).
9. **Policy Gate Registry**: On-chain registry for the 8 pre-launch policy gate checks (permissions, simulations, launch limits, guardian approval) verified before Controlled Execution.

---

## 3. Autonomous Launch Pipeline (30-Hour Sequence)

The autonomous launch cycle is governed by a **30-hour lifecycle** (`108,000 seconds`), scaled proportionally from the previous 24h sequence:

```text
T-30H (108,000s) ──► T-22H30 (81,000s) ──► T-15H (54,000s) ──► T-07H30 (27,000s) ──► T-01H15 (4,500s) ──► T-00 (0s)
  PAIR SELECTION       PARAMETER FORM.     SIMULATION & VAL.      CONTRACT PREP.         FINAL POLICY CHECK    CONTROLLED EXEC.
```

- **T-30H (PAIR_SELECTION)**: Highest scoring opportunity paired with target Stock Token.
- **T-22H30 (PARAMETER_FORMULATION)**: Tokenomics, bonding curve parameters, and initial liquidity bounds computed.
- **T-15H (SIMULATION_VALIDATION)**: Stress-test scenarios, slippage models, and sandwich protection simulated.
- **T-07H30 (CONTRACT_PREPARATION)**: Approved launch parameters assembled for Launch Executor and Pons adapter.
- **T-01H15 (FINAL_POLICY_CHECK)**: Final verification of 8 mandatory policy gates and affirmative guardian approval.
- **T-00 (CONTROLLED_EXECUTION)**: Approved action submitted through restricted Launch Executor on Robinhood Chain.

---

## 4. Protocol Economics (Landing Page)

Positioned prominently on the landing page (`/`), the economic engine establishes the core value loop:
- **Revenue Split**:
  - **50% JEVO Protocol Treasury**: Retained for infrastructure, autonomous compute, and liquidity depth.
  - **50% Buyback & Burn**: Used to systematically acquire $JEVO from open markets and burn permanently.
- **Technical Truthfulness Commitment**:
  - Explicitly labeled with badge **`PROTOCOL ROADMAP`** and sub-badge **`PLANNED · NOT DEPLOYED`**.
  - Copy framed around commitments (*"built for"*, *"designed to"*) without implying automatic on-chain buybacks are active in Phase 0.

---

## 5. Runtime Modes & Environment Configurations

### A. Demo Mode (`NEXT_PUBLIC_JEVO_DEMO_MODE=true`)
- Default for static builds and Vercel hosting when a live PostgreSQL database is not connected to Vercel.
- Serves verified mock agent state from `web/src/data/mock-agent-state.ts`.
- Badge in `/jev` Decision Audit panel explicitly renders **`DEMO DATA`**.
- Hero anatomy card renders **`DEMO DATA · PHASE 0`**.

### B. Live Worker Mode (`NEXT_PUBLIC_JEVO_DEMO_MODE=false`)
- Connected to the local or hosted worker API (`NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`).
- Queries live PostgreSQL database for real cycles (`cycle-delta-...`), active cycle IDs, and real-time elapsed seconds.
- Badge in `/jev` Decision Audit renders **`PHASE 0 · SIMULATED`**.
- Background worker execution paths:
  - `JEV_MODE=mock`: Local deterministic factor scoring.
  - `JEV_MODE=real`: Model evaluations via Vercel AI Gateway (`typesafe-ai/jev`) using `AI_GATEWAY_API_KEY`.
  - `PROVIDER_MODE=mock`: Deterministic market telemetry.
  - `PROVIDER_MODE=real`: Real-time market/narrative data via Alpha Vantage API.

---

## 6. Social Integration & UI Header Polish

- Header and sidebar include official X/Twitter (`https://x.com/jevoprotocol`) and GitHub (`https://github.com/Castforge-prompt/Jevo`) icons.
- CSS/DOM targeting attributes:
  - `data-social-link="x"`
  - `data-social-link="github"`
- Clean icon-only presentation with diagonal external link indicators (`↗`) and responsive compact spacing for mobile viewports (390px) and wide screens (1440px).
- External links opened securely with `target="_blank"` and `rel="noopener noreferrer"`.
- Next.js image loading configured with `images: { unoptimized: true }` in `web/next.config.ts` for reliable Vercel image asset serving.

---

## 7. Recommended Screen Recording Flow

For video demonstrations and screen recordings:
1. **Landing Page (`/`)**:
   - Hero: "Autonomous Stock × Meme Intelligence on Robinhood Chain".
   - Powered by JEV Section: 7-stage evaluation stream.
   - Protocol Economics Section: 50% Protocol Treasury / 50% Buyback & Burn with `PROTOCOL ROADMAP` badge.
2. **JEV Decision Engine (`/jev`)**:
   - Anatomy of a Decision card.
   - Decision Audit // 05 (Recent Evaluation Stream).
3. **App Intelligence Workspace (`/app`)**:
   - Cartesian Opportunity Field (Score vs Narrative Momentum).
   - Opportunity Ranking (NVDA, GME, TSLA, COIN, PLTR, AMD, AAPL).
4. **Pairing Marketplace (`/pairing`)**:
   - Candidate pairs (e.g. $NVDA × $GPU compute thesis).
   - 6-dimension evaluation radar and synergy thesis.
5. **Autonomous Launch (`/launch`)**:
   - 30-Hour Countdown progression (`T-30H` through `T-00`).
   - 8 Pre-Launch Policy Gates status review.
6. **Agent Memory & Trace (`/memory`)**:
   - Historical cycle comparisons and immutable event log.
7. **Contract Registry (`/contracts`)**:
   - **JEVO Deployed Tab**: Robinhood Chain Mainnet (`0xeBfc...3e4d`) showing `SOURCE VERIFIED` status + Testnet (`0x9027...87f4`).
   - **Monitored Stock Tokens Tab**: Monitored US equity tokens.
   - **Planned Tab**: 9 planned architectural contracts (`Phase 0 · Deferred`).

---

## 8. Verification & CLI Commands

```bash
# 1. Run worker test suite (88 tests passing):
cd worker && bun test

# 2. Lint web application:
bun --filter web lint

# 3. Production build (web):
NEXT_PUBLIC_JEVO_DEMO_MODE=true bun --filter web build

# 4. Start local development environment:
# Terminal 1: Worker (Fastify + BullMQ + Redis + Postgres)
cd worker && bun src/index.ts

# Terminal 2: Web frontend
cd web && bun dev
```
