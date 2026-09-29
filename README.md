<!--
<div align="center">
  <img src="..." alt="JEVO Agent banner" width="100%" />
</div>
-->

<div align="center">

# JEVO Agent

**Autonomous market intelligence for discovering, evaluating, and preparing the next stock × meme opportunity.**

[**Live site**](https://www.jevoagent.tech/) · [**X**](https://x.com/jevoaagentt) · [**GitHub**](https://github.com/Castforge-prompt/Jevo)

</div>

JEVO Agent is an autonomous market intelligence agent that observes market,
narrative, social, and stock-token signals; evaluates structured opportunities
through the JEV decision interface; ranks opportunities; forms stock × meme
pairing theses; maintains agent memory and protocol events; and prepares
qualified opportunities for a future autonomous launch lifecycle.

JEVO Agent is an operating system for observable market decisions. It is not a
chatbot, a stock-picking service, or a financial adviser.

## What JEVO Agent does

JEVO turns changing inputs into an auditable sequence of state transitions:

- observes structured market and narrative inputs;
- evaluates opportunity dimensions through JEV;
- publishes a canonical opportunity rank and decision record;
- exposes structured evidence, score dimensions, and state history;
- proposes stock × meme pairing candidates;
- records memory and protocol events for later inspection; and
- advances qualified candidates through a guarded launch lifecycle.

The product surface is deliberately decision-oriented. It exposes observable
events and structured evidence, never hidden model chain-of-thought.

## What it is — and is not

| JEVO Agent is                                                       | JEVO Agent is not                                   |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| An autonomous market intelligence and ranking system                | A chatbot or conversational assistant               |
| A JEV-powered structured decision interface                         | A stock-picking or return-prediction service        |
| A research surface for stock-token and meme-market opportunities    | Financial, investment, or trading advice            |
| A stateful agent with memory, events, pairings, and launch controls | An unrestricted autonomous trader                   |
| Testnet-aware infrastructure for a future launch lifecycle          | A guarantee that any pairing or launch will succeed |

## Core agent flow

```text
MARKET SIGNALS
      ↓
JEVO AGENT OBSERVES
      ↓
JEV DECISION LAYER
      ↓
OPPORTUNITY SCORING
      ↓
RANKING
      ↓
STOCK × MEME PAIRING
      ↓
AGENT MEMORY / EVENTS
      ↓
AUTONOMOUS LAUNCH LIFECYCLE
```

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Next.js workspace (web/)                                              │
│ Overview · Opportunity Field · Stock Detail · Pairings · Launch       │
│ Memory · Admin                                                         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ REST + Server-Sent Events
                                │ /api/v1/*
┌───────────────────────────────▼──────────────────────────────────────┐
│ Fastify worker/API (worker/)                                          │
│ Agent cycle · DecisionEngine · pairing evaluation · launch progression │
│ Admin and internal job routes · MCP read-only intelligence facade      │
└───────────────┬───────────────────────┬───────────────────┬───────────┘
                │                       │                   │
        ┌───────▼────────┐      ┌───────▼────────┐  ┌──────▼───────────┐
        │ PostgreSQL      │      │ Redis/BullMQ    │  │ Provider layer    │
        │ canonical state │      │ queues + events │  │ market/narrative/ │
        │ Drizzle ORM     │      │ SSE backplane  │  │ social/stock/JEV   │
        └─────────────────┘      └────────────────┘  └──────────────────┘
                │
        ┌───────▼────────┐
        │ Testnet registry│
        │ operator-attested│
        │ pairing records  │
        └─────────────────┘
```

The worker is the source of canonical runtime state. The web application reads
that state through the API and receives invalidation events through SSE. The
shared `@jevo/protocol-types` package keeps API envelopes, records, and event
shapes aligned across the two applications.

## Production Deployment

JEVO Agent is deployed through project at [www.jevoagent.tech](https://www.jevoagent.tech/).

The repository's `vercel.json` defines two services in one deployment:

- **web** — the Next.js application rooted at `web/`;
- **api** — the Fastify worker/API rooted at `worker/`.

The deployment rewrites `/api/v1/*` and `/api/cron/*` to the API service and
routes the remaining application paths to the web service. Queue triggers for
agent cycles and launch progression are kept in the web service configuration.

Vercel Cron registrations are intentionally absent from the current Hobby
configuration. The worker cron handlers, `CRON_SECRET` authentication,
internal job routes, queue implementation, and manual/admin trigger remain
available so a Pro schedule can be restored without redesigning the agent
cycle.

Production credentials belong in Vercel/server-side environment settings only.
Never expose database, Redis, provider, queue, admin, or JEV credentials through
`NEXT_PUBLIC_*` variables.

## Providers and data sources

Provider selection is explicit. Development examples default to deterministic
mock providers; production requires each granular mode to be configured rather
than silently inheriting a default.

| Signal or subsystem      | Real adapter                                                | Mock adapter / current fallback                 | Configuration                                 |
| ------------------------ | ----------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Market data              | Alpha Vantage `GLOBAL_QUOTE`                                | `MockMarketDataProvider`                        | `MARKET_DATA_MODE`                            |
| Narrative/news           | Alpha Vantage `NEWS_SENTIMENT`                              | `MockNarrativeProvider`                         | `NARRATIVE_MODE`                              |
| Social velocity          | Not yet a production provider                               | `MockSocialProvider`                            | Explicitly mock in the current implementation |
| Stock-token state        | Robinhood Chain RPC with DexPaprika metadata                | `MockStockTokenProvider`                        | `STOCK_TOKEN_MODE`                            |
| JEV decisions            | Vercel AI Gateway / TypeSafe `jev` adapter                  | `MockJevProvider`                               | `JEV_MODE`                                    |
| Pairing and launch state | Worker decision and lifecycle services backed by PostgreSQL | No silent UI-only substitute in production mode | Worker/API state                              |

When `JEV_MODE=real`, the JEV credential is server-side only. The frontend
never receives `AI_GATEWAY_API_KEY`, `JEV_API_KEY`, or provider request
payloads. The worker stores structured decisions, confidence, score
dimensions, signals/evidence, model version, timestamps, and observable
metadata—not hidden reasoning.

## Testnet and on-chain registry

The `contracts/` package contains `JevoPairingRegistry`, an immutable,
operator-attested registry for approved stock × meme pairings.

- Robinhood Chain testnet chain ID: `46630`
- Testnet RPC: `https://rpc.testnet.chain.robinhood.com/rpc`
- Testnet explorer: `https://explorer.testnet.chain.robinhood.com`
- Testnet faucet: `https://faucet.testnet.chain.robinhood.com`
- Robinhood Chain mainnet chain ID: `4663`

The current testnet deployment record is:

| Contract              | Network                           | Address                                                                                                                                         | Transaction                                                                                                                                                                                |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `JevoPairingRegistry` | Robinhood Chain testnet (`46630`) | [`0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4`](https://explorer.testnet.chain.robinhood.com/address/0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4) | [`0xadeea5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64`](https://explorer.testnet.chain.robinhood.com/tx/0xadeea5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64) |

The registry does not hold funds, transfer tokens, execute launches, or prove
the off-chain approval process. Verify addresses and transactions on the
explorer before relying on them. Never place private keys or RPC credentials in
source files or committed environment files.

## Repository structure

```text
.
├── web/                    # Next.js frontend and App Router workspace
├── worker/                 # Fastify API, agent cycle, queues, providers, DB
├── packages/
│   └── protocol-types/     # Shared Zod schemas and TypeScript contracts
├── contracts/              # Foundry registry contract and deployment tooling
├── docs/                   # Product briefs and implementation handoffs
├── scripts/                # Local deployment/status helpers
├── docker-compose.dev.yml  # Local PostgreSQL and Redis services
├── vercel.json             # Vercel web/API services and rewrites
├── .env.example            # Root environment reference
└── package.json            # Bun workspace scripts
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) `1.3.14` or compatible;
- Docker Desktop or another Docker Compose runtime for local PostgreSQL and
  Redis;
- Foundry only if you are building or testing the Solidity registry.

### Install dependencies

```bash
bun install
```

### Start local infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

The development compose file exposes PostgreSQL on port `5433` and Redis on
port `6380` by default.

### Configure the worker

```bash
cp worker/.env.example worker/.env
```

At minimum, keep the local `DATABASE_URL` and `REDIS_URL` values aligned with
the compose file. The sample provider modes are intentionally mock-backed:

```dotenv
NODE_ENV=development
JEV_MODE=mock
MARKET_DATA_MODE=mock
NARRATIVE_MODE=mock
STOCK_TOKEN_MODE=mock
```

For real JEV evaluations, set `JEV_MODE=real` and provide the server-side
`AI_GATEWAY_API_KEY`. For real Alpha Vantage market or narrative data, set the
corresponding mode to `real` and provide `ALPHA_VANTAGE_API_KEY`. Do not put
either credential in `web/.env.local` or any `NEXT_PUBLIC_*` variable.

### Migrate and seed local data

```bash
bun --filter worker db:migrate
bun --filter worker db:seed
```

### Run the applications

In separate terminals:

```bash
bun run dev:worker
bun run dev:web
```

The worker listens on `http://localhost:4000` by default. Configure the web
application with `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` and use
`NEXT_PUBLIC_JEVO_DEMO_MODE=true` only when an intentional fixture/demo build
is required. With demo mode disabled, API failures are surfaced instead of
silently replaced with fixture state.

## Useful commands

### Web

```bash
bun --filter web lint
bun --filter web build
bun --filter web start
```

### Worker

```bash
bun --filter worker typecheck
bun --filter worker test
bun --filter worker db:generate
bun --filter worker db:migrate
bun --filter worker db:seed
```

### Smart contracts

```bash
cd contracts
forge build
forge test -vv
forge script script/Deploy.s.sol
```

### Workspace helpers

```bash
bun run deploy:show
```

This prints the repository's deployment/status replay helpers; it does not
replace a deployment review or an explicit signing step.

## API surface

The worker returns a consistent `{ "data": ..., "meta": ... }` envelope for
successful resource responses. The default local base URL is
`http://localhost:4000/api/v1`.

### Canonical read routes

```text
GET /api/v1/agent/status
GET /api/v1/opportunities
GET /api/v1/stocks/:symbol
GET /api/v1/pairings
GET /api/v1/pairings/:id
GET /api/v1/launches
GET /api/v1/launches/:id
GET /api/v1/memory
GET /api/v1/cycles
GET /api/v1/events
GET /api/v1/events/stream
```

`/api/v1/events/stream` is the Server-Sent Events path used for realtime
invalidation. The frontend refetches canonical resources after relevant event
types instead of treating an event payload as an alternative source of truth.

### JEVO Intelligence facade

The read-only `JEVO Intelligence` layer is an API/MCP-facing facade inside
JEVO Agent, not the product name:

```text
GET /api/v1/intelligence/stocks/:symbol
GET /api/v1/intelligence/opportunities
GET /api/v1/intelligence/pairings
GET /api/v1/intelligence/activity
GET /api/v1/intelligence/decisions/:id
```

These endpoints read canonical worker tables and include provider-mode
metadata where applicable.

### Operator and runtime routes

Admin mutations are under `/api/v1/admin/*` and are protected by the worker's
Bearer-token allowlist. The surface includes agent pause/resume, scan trigger,
pairing approve/reject/edit, launch scheduling/emergency pause, and decision
configuration controls.

Internal queue delivery is under `/api/v1/internal/jobs/*` and uses the
internal job token. Cron handlers remain available under:

```text
GET /api/cron/jevo/delta
GET /api/cron/jevo/ranking
GET /api/cron/jevo/full
GET /api/cron/jevo/narrative
GET /api/cron/jevo/launch
```

Production cron requests require `Authorization: Bearer $CRON_SECRET`. A
deployment plan may register or disable Vercel Cron schedules independently;
the handlers and queue path remain part of the worker architecture.

## MCP surface

The worker includes a read-only stdio MCP server. Start it from the worker
package with:

```bash
cd worker
bun src/mcp/server.ts
```

Available tools:

| Tool                     | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `get_stock_state`        | Retrieve canonical stock state, rank, and JEV evaluation                    |
| `rank_stocks`            | Retrieve the latest ranked opportunities, with sorting and decision filters |
| `get_pairing_candidates` | Retrieve operator-evaluated stock × meme pairing candidates                 |
| `get_jevo_decision`      | Retrieve a structured JEV decision and factor breakdown                     |
| `get_agent_activity`     | Retrieve memory and observable state-transition activity                    |

The MCP surface is intentionally evidence-oriented. It does not expose hidden
model reasoning or provide trading instructions.

## Current limitations

- Real JEV mode requires a valid server-side Vercel AI Gateway credential and
  an available `typesafe-ai/jev` model route.
- Social velocity is currently represented by an explicit mock provider; it is
  not a claim of live social coverage.
- Alpha Vantage free-tier operation is rate-limited and generally reflects
  end-of-day equity data. The worker adds caching and request pacing.
- A real provider failure must remain visible as a provider failure; the
  system should not fabricate a score, rank, pairing, launch deadline, or
  network state to make the interface look live.
- Launch progression is a guarded lifecycle and registry workflow. The
  current registry does not custody funds or autonomously execute a mainnet
  launch.
- PostgreSQL and Redis are required for canonical state, queue delivery, and
  realtime event propagation.
- Testnet contracts are not audited. Mainnet deployment requires separate
  operational review and explicit human sign-off.

## Roadmap and protocol economics

The following are planned directions, not currently enabled protocol promises:

1. Add a production social-signal provider and broaden verified narrative
   coverage.
2. Expand the Robinhood Chain testnet launch executor behind policy gates,
   dedicated wallet controls, and human approval.
3. Move from operator-attested pairing records toward audited, observable
   lifecycle execution.
4. Add launch history, richer agent memory, and provider health reporting
   without weakening the canonical-data contract.
5. Evaluate protocol economics—such as registry, launch, or routing fees;
   treasury policy; and participant incentives—only after the execution model,
   contracts, security review, and governance are defined. No token, fee
   schedule, or economic return is promised by this repository today.

## License and disclaimer

No open-source license has been declared at the repository root. Unless a
separate license is provided, all rights are reserved by the copyright holder.

JEVO Agent is experimental software for market intelligence and testnet
infrastructure. Data may be delayed, incomplete, simulated, or unavailable;
provider modes must be inspected before relying on an output. Nothing in this
repository is financial, investment, legal, or tax advice, and no output is a
recommendation or guarantee of performance. Use mainnet funds only after
independent review, testing, and explicit operational approval.
