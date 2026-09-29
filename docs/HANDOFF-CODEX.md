# JEVO Agent — Codex Runtime Verification Handoff

**Verified revision:** `3c262fb` (`origin/main`)

This document records runtime and architecture truth verified from the current repository, worker source, read-only chain checks, production HTTP checks, and the latest local validation run. It is deliberately separate from the AGY implementation handoffs.

## 1. Product identity

JEVO Agent is the product. JEV is the AI decision layer used by the agent. JEVO Intelligence is the external read-only access layer. MCP currently exposes read-only intelligence tools.

## 2. Canonical JEVO Agent flow

```text
Market / narrative / social / stock-token observations
                         ↓
                 Agent cycle + delta gate
                         ↓
                   JEV structured decision
                         ↓
             Deterministic opportunity scoring
                         ↓
                         Ranking
                         ↓
                 Pairing candidate proposal
                         ↓
              Memory + protocol event records
                         ↓
          REST reads + Redis/SSE invalidation
                         ↓
                    JEVO frontend
```

The cycle persists canonical state in PostgreSQL. The frontend consumes worker REST/SSE state when `NEXT_PUBLIC_JEVO_DEMO_MODE=false`; explicit demo mode uses `mockAgentState` and fixture routes.

## 3. Trigger paths

- Local BullMQ schedulers register DELTA (60s), RANKING (5m), FULL (30m), and NARRATIVE (1h) cycles.
- Local BullMQ also advances launch stages every 60 seconds.
- Vercel runtime uses Queue topics `jevo-agent-cycles` and `jevo-launch-progression`; queue handlers call the same worker functions.
- `/api/cron/jevo/{delta|ranking|full|narrative|launch}` handlers are preserved and require `CRON_SECRET` in production, but `vercel.json` has no Vercel Cron registration.
- Authenticated admin scan requests enqueue a cycle.
- Internal queue callbacks require `x-jevo-internal-token`.
- `worker/scripts/trigger_real_cycle.ts` is a guarded developer/manual path, not a production scheduler.
- Admin pause/resume controls local BullMQ only and return `501` for Vercel Queue delivery.

## 4. JEV role and runtime mode

The real adapter uses Vercel AI SDK `experimental_evaluate` with model `typesafe-ai/jev` and server-side `AI_GATEWAY_API_KEY`. It returns:

- `PROMOTE`, `HOLD`, or `DEMOTE`;
- confidence and structured signals;
- qualitative scores for narrative momentum, cultural relevance, meme compatibility, crypto adjacency, and pair compatibility;
- provider/model version metadata.

`DecisionEngine` validates the response and removes reasoning, explanation, and chain-of-thought fields before persistence. JEV does not compute the final composite opportunity score and does not submit transactions.

The local worker configuration is `JEV_MODE=mock`. A real provider is implemented, but production JEV mode could not be verified because production canonical API reads currently fail.

## 5. Provider reality

| Provider | Implementation | Verified runtime state |
|---|---|---|
| JEV | Real AI Gateway adapter plus mock adapter | Local mock; production mode unverified |
| Market | Alpha Vantage real adapter plus mock adapter | Local mock; production mode unverified |
| Narrative | Alpha Vantage real adapter plus mock adapter | Local mock; production mode unverified |
| Social | Mock provider only | Mock by design |
| Stock Token | Robinhood canonical catalog, RPC metadata, DexPaprika read-only price adapter | Local mock; production mode unverified |

The seed universe contains 15 active symbols, but only seven have canonical Robinhood token metadata in the current provider catalog. The other eight are explicitly null/unverified stock-token addresses and must not be described as verified on-chain assets.

## 6. Opportunity scoring and ranking

The final opportunity score is deterministic arithmetic over seven components:

```text
marketMomentum       0.15
narrativeMomentum     0.20
socialVelocity        0.15
culturalRelevance    0.15
memeCompatibility     0.15
cryptoAdjacency       0.10
pairCompatibility     0.10
```

Active weights are read from `agent_config_versions`; a validated default configuration is bootstrapped only when the table is empty. Ranking sorts by score descending, then symbol ascending, and persists `opportunity_scores` plus `rank_history` with previous-rank metadata.

## 7. Pairing flow and human gates

The cycle evaluates pairings when JEV promotes an asset or when its rank is within the top three, subject to a curated meme-concept match. JEV evaluates six pairing dimensions and the deterministic pairing score is persisted with the candidate.

Automatic output stops at `PROPOSED`.

```text
PROPOSED → (operator approve) → CURATED
CURATED  → (operator schedule) → LAUNCH_CANDIDATE
```

Rejecting archives the candidate. There is no automatic curation or automatic launch scheduling.

## 8. Autonomous Launch 30-hour lifecycle

The state machine contains six stages:

```text
T-30H   CANDIDATE_SELECTED
T-22H30 NARRATIVE_VALIDATION
T-15H   PAIRING_VALIDATION
T-07H30 CONTRACT_PREPARATION
T-01H15 FINAL_POLICY_CHECK
T-00    CONTROLLED_EXECUTION
```

Scheduling is an authenticated operator action. At `T-01H15`, the worker marks the eight policy checks complete. At `T-00`, it sets readiness to `READY` while preserving `transactionStatus=NOT_SUBMITTED`.

## 9. Exact autonomous stop point

JEVO stops after recording launch state. There is no signer, token factory, Launch Executor, Pons adapter invocation, token deployment, liquidity initialization, or worker transaction submission path.

## 10. Testnet and mainnet registry reality

`JevoPairingRegistry` is an owner-only, non-payable transparency registry. It records approved pairing metadata; it does not hold funds or execute launches.

### Robinhood testnet

- Chain ID: `46630`
- Address: `0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4`
- Deployment receipt succeeded and bytecode is present.
- Owner: `0xd7FBb958184338c960F8B6ad6c778256501C4dBC`
- `totalRecords()`: `1`
- Read-only event check: `NVDA × $COMPUTE`, score `7500` bps
- Record transaction: `0xe243b9721b7035d8b3e77fed53c1f3f522bfdd94150c1214f7a27ad3a64220bd`

### Robinhood mainnet

- Chain ID: `4663`
- Address: `0xeBfcBF9675F045095883A199ca4a40D59E873e4d`
- Deployment receipt succeeded and bytecode is present.
- Owner: `0x90200277AD2DB4Bb7E6fa5D94d0F8198F760219E`
- `totalRecords()`: `0`

The worker does not write to either registry automatically.

## 11. Production runtime health

Public pages `/`, `/app`, `/jev`, and `/contracts` returned HTTP `200`.

Canonical production reads returned HTTP `500` for agent status, opportunities, stocks, pairings, launches, memory, cycles, events, and all tested Intelligence data routes. `/api/v1/intelligence/status` returned `404` because that route does not exist. `/api/v1/events/stream` opened with HTTP `200` SSE headers, but no event or heartbeat was observed during the check.

The deployed frontend rendered fixture-looking values (`CYCLE 9841`, NVDA rank/score, `$GPU` pairing), so production frontend/API parity is not verified. This is an effective demo-state observation; the deployed environment value itself is not exposed.

## 12. Intelligence API and MCP reality

Implemented Intelligence routes:

- `/api/v1/intelligence/stocks/:symbol`
- `/api/v1/intelligence/opportunities`
- `/api/v1/intelligence/pairings`
- `/api/v1/intelligence/activity`
- `/api/v1/intelligence/decisions/:id`

The facade reads canonical database state and attaches provider-mode metadata. MCP exposes exactly five read-only tools: stock state, ranking, pairing candidates, JEV decision, and agent activity. No MCP mutation, wallet, or transaction tool exists.

## 13. Memory, events, and SSE

Memory records contain structured previous/current state, observed change, decision, evidence references, timestamps, and cycle IDs. The cycle currently writes one memory row for the top-ranked asset per cycle.

Protocol events are persisted in PostgreSQL and published through Redis. The SSE route supports database backfill, `Last-Event-ID`, live buffering during backfill, duplicate suppression, heartbeat, and disconnect cleanup. The frontend maps event types to TanStack Query invalidations and relies on browser EventSource reconnect behavior.

`useProtocolState` still reports a top-level error primarily from the opportunities query while secondary domain failures can be represented as partial data. This remains an integration risk.

## 14. Protocol economics status

Protocol economics are **PLANNED / NOT IMPLEMENTED**. No code path was found for protocol revenue, treasury accounting, fees, buyback, burn, or token economics. The registry is non-payable and does not hold protocol funds.

## 15. Mainnet autonomy gaps

1. Production database/API health must be restored.
2. Production frontend must consume canonical state rather than rendered demo fixtures.
3. Actual production provider modes must be verified.
4. Social data remains mock-only.
5. No restricted agent signer or execution contract exists.
6. No Token Factory, Launch Executor, Pons adapter, or worker transaction path exists.
7. Pairing curation and launch scheduling remain human-gated.
8. The mainnet registry is deployed but empty.
9. Protocol economics are roadmap-only.
10. Vercel Cron is not registered; Queue handlers are present but live delivery is unverified.

## 16. Recording-safe claims

Safe statements:

- JEVO Agent performs bounded, structured off-chain evaluation.
- JEV is the decision layer and emits typed decisions/evidence, not hidden reasoning.
- Opportunity scoring and ranking are deterministic and persisted.
- Pairing proposals are generated automatically but require human curation.
- Launch progression is a 30-hour state machine only.
- The testnet registry contains one operator-attested record; mainnet is empty.
- MCP is read-only.

Do not claim:

- autonomous on-chain launch execution;
- live token deployment, liquidity initialization, or Pons execution;
- live buyback/burn or treasury economics;
- production canonical runtime health while API reads return `500`;
- production live JEV/market/narrative provider mode without runtime evidence.

## 17. Current blockers

- Production canonical PostgreSQL-backed API reads return `500`.
- Production frontend is visibly rendering fixture/demo state instead of verified canonical state.
- Production SSE cannot be considered live while canonical backfill/read paths fail.
- Worker integration tests require reachable Postgres/Redis; the latest local run was `47 passed, 1 skipped, 25 failed, 2 errors`, primarily `ECONNREFUSED`, with the live Alpha Vantage smoke also unable to connect.
- Mainnet launch execution infrastructure is not implemented.

## Conflicting claims in `docs/HANDOFF.md`

The current AGY handoff contains claims that must not be used as runtime proof:

1. `132 passed, 1 skipped, 0 failed` conflicts with the latest observed worker test run (`47 passed, 1 skipped, 25 failed, 2 errors`).
2. `30H Launch Pipeline Active` is true only for persisted state progression after operator scheduling; it does not mean autonomous on-chain execution.
3. The 15-asset statement is a seeded/mock universe claim. Only seven assets currently have canonical Robinhood token metadata; eight have null/unverified token addresses.
4. The handoff does not clearly state that JEV, market, narrative, and stock-token runtime modes are mock locally and unverified in production.
5. The handoff does not clearly state that production REST database reads currently return `500` and that deployed frontend output is showing fixture state.
6. The handoff omits the explicit `STATE ONLY` launch boundary, `NOT_SUBMITTED` transaction state, and absence of signer/Launch Executor/Pons execution code.

