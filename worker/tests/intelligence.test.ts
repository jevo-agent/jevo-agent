import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { FastifyInstance } from "fastify";
import { executeAgentCycle } from "../src/agent/cycle";
import { createServer } from "../src/api/server";
import { db } from "../src/db/client";
import {
  agentCycles,
  jevDecisions,
  launchCandidates,
  launchCycles,
  memeConcepts,
  memoryEvents,
  opportunityScores,
  pairingCandidates,
  pairingDecisions,
  pairingHistory,
  protocolEvents,
  rankHistory,
} from "../src/db/schema";
import { seedAssets, seedMemeConcepts } from "../src/db/seed";
import { executeMcpTool, MCP_TOOLS } from "../src/mcp";
import type { CanonicalIntelligenceDTO } from "../src/intelligence/facade";

describe("Jevo Intelligence Facade, REST API & MCP Prototype", () => {
  let app: FastifyInstance;
  const testCycleId = "cycle-intel-test-01";

  beforeAll(async () => {
    // 1. Ensure initial stock assets exist
    await seedAssets();

    // 2. Ensure test meme concepts exist for pairing evaluation
    await seedMemeConcepts();

    // 3. Run a complete agent cycle to populate rank_history, opportunity_scores, jev_decisions, pairings, memory
    await executeAgentCycle("DELTA", {
      forcedCycleId: testCycleId,
      previousCycleId: null,
    });

    // 4. Instantiate Fastify app with newly registered intelligence routes
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();

    // Clean up test cycle data
    await db.delete(launchCycles);
    await db.delete(launchCandidates);
    await db.delete(pairingHistory);
    await db.delete(pairingDecisions);
    await db.delete(pairingCandidates);
    await db.delete(memeConcepts);
    await seedMemeConcepts();
    await db.delete(rankHistory);
    await db.delete(opportunityScores);
    await db.delete(jevDecisions);
    await db.delete(memoryEvents);
    await db.delete(protocolEvents);
    await db.delete(agentCycles);
  });

  // --------------------------------------------------------------------------
  // 1. GET /api/v1/intelligence/stocks/:symbol
  // --------------------------------------------------------------------------
  it("GET /api/v1/intelligence/stocks/:symbol - returns 200 with canonical stock DTO", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/stocks/NVDA",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    expect(json.data).toBeDefined();
    const item: CanonicalIntelligenceDTO = json.data;
    expect(item.entity).toBe("stock");
    expect(item.symbol).toBe("NVDA");
    expect(item.currentState).toBeDefined();
    expect(item.currentState?.active).toBe(true);
    expect(typeof item.score).toBe("number");
    expect(typeof item.confidence).toBe("number");
    expect(item.source?.providerMode).toBeDefined();
    expect(item.source?.providerMode.providerMode).toBe("mock");
    expect(item.source?.providerMode.isSimulated).toBe(true);

    // Meta explicitly reports provider mode
    expect(json.meta?.providerMode).toBeDefined();
    expect(json.meta?.providerMode.isSimulated).toBe(true);
  });

  it("GET /api/v1/intelligence/stocks/:symbol - returns 404 for unknown stock", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/stocks/NONEXISTENT",
    });

    expect(response.statusCode).toBe(404);
  });

  // --------------------------------------------------------------------------
  // 2. GET /api/v1/intelligence/opportunities
  // --------------------------------------------------------------------------
  it("GET /api/v1/intelligence/opportunities - returns 200 with ranked opportunity DTOs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/opportunities?sort=score",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const first: CanonicalIntelligenceDTO = json.data[0];
    expect(first.entity).toBe("opportunity");
    expect(first.symbol).toBeDefined();
    expect(typeof first.score).toBe("number");
    expect(first.cycleId).toBeDefined();
    expect(first.source?.providerMode).toBeDefined();
    expect(json.meta?.total).toBe(json.data.length);
  });

  // --------------------------------------------------------------------------
  // 3. GET /api/v1/intelligence/pairings
  // --------------------------------------------------------------------------
  it("GET /api/v1/intelligence/pairings - returns 200 with pairing candidate DTOs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/pairings",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      const first: CanonicalIntelligenceDTO = json.data[0];
      expect(first.entity).toBe("pairing");
      expect(first.symbol).toBeDefined();
      expect(first.currentState).toBeDefined();
      expect(first.factors).toBeDefined();
      expect(typeof first.score).toBe("number");
    }
  });

  // --------------------------------------------------------------------------
  // 4. GET /api/v1/intelligence/decisions/:id
  // --------------------------------------------------------------------------
  it("GET /api/v1/intelligence/decisions/:id - returns 200 with decision DTO", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/decisions/NVDA",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    const item: CanonicalIntelligenceDTO = json.data;
    expect(item.entity).toBe("decision");
    expect(item.symbol).toBe("NVDA");
    expect(typeof item.confidence).toBe("number");
    expect(["PROMOTE", "HOLD", "DEMOTE"]).toContain(item.decision ?? "");
    expect(item.source?.providerMode).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 5. GET /api/v1/intelligence/activity
  // --------------------------------------------------------------------------
  it("GET /api/v1/intelligence/activity - returns 200 with canonical activity DTOs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/activity",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const first: CanonicalIntelligenceDTO = json.data[0];
    expect(first.entity).toBe("activity");
    expect(first.cycleId).toBeDefined();
    expect(first.source?.providerMode).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 6. PROOF: NVDA fallback does NOT leak into activity or other endpoints!
  // --------------------------------------------------------------------------
  it("CRITICAL: intelligence activity does NOT fall back to NVDA when unknown subjectId is passed", async () => {
    // When querying for an unknown subject ID:
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/activity?subjectId=UNKNOWN_TOKEN_9999",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    // Legacy /api/v1/memory had a bug where missing/unmatched subjects returned NVDA events.
    // Our intelligence facade MUST return 0 items for an unknown subject, NEVER NVDA!
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(0);

    // Verify none of the items contain NVDA as subject
    const nvdaItems = json.data.filter(
      (item: CanonicalIntelligenceDTO) => (item.source as Record<string, unknown>)?.subjectId === "NVDA",
    );
    expect(nvdaItems.length).toBe(0);
  });

  it("CRITICAL: intelligence activity preserves explicit subjectId filter without NVDA contamination", async () => {
    // Querying for TSLA must return events that are strictly TSLA or empty, never NVDA
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/activity?subjectId=TSLA",
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.body);

    expect(Array.isArray(json.data)).toBe(true);
    for (const item of json.data) {
      expect((item.source as Record<string, unknown>)?.subjectId).toBe("TSLA");
    }
  });

  // --------------------------------------------------------------------------
  // 7. MCP Prototype Tool Calls
  // --------------------------------------------------------------------------
  describe("MCP Tools (read-only prototype)", () => {
    it("exposes all 5 read-only tools without financial/trading tools", () => {
      const toolNames = MCP_TOOLS.map((t) => t.name);
      expect(toolNames).toContain("get_stock_state");
      expect(toolNames).toContain("rank_stocks");
      expect(toolNames).toContain("get_pairing_candidates");
      expect(toolNames).toContain("get_jevo_decision");
      expect(toolNames).toContain("get_agent_activity");
      expect(toolNames.length).toBe(5);

      // Verify no trading or wallet tools exist
      for (const name of toolNames) {
        expect(name).not.toMatch(/trade|wallet|buy|sell|send|execute_swap/i);
      }
    });

    it("MCP tool: get_stock_state executes via facade", async () => {
      const res = await executeMcpTool("get_stock_state", { symbol: "NVDA" });
      expect(res.isError).toBeFalsy();
      expect(res.content.length).toBe(1);
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.entity).toBe("stock");
      expect(parsed.symbol).toBe("NVDA");
    });

    it("MCP tool: rank_stocks executes via facade", async () => {
      const res = await executeMcpTool("rank_stocks", { limit: 3 });
      expect(res.isError).toBeFalsy();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.opportunities.length).toBeLessThanOrEqual(3);
      expect(parsed.providerMode.isSimulated).toBe(true);
    });

    it("MCP tool: get_pairing_candidates executes via facade", async () => {
      const res = await executeMcpTool("get_pairing_candidates", { limit: 5 });
      expect(res.isError).toBeFalsy();
      const parsed = JSON.parse(res.content[0].text);
      expect(Array.isArray(parsed.pairings)).toBe(true);
    });

    it("MCP tool: get_jevo_decision executes via facade", async () => {
      const res = await executeMcpTool("get_jevo_decision", { id: "NVDA" });
      expect(res.isError).toBeFalsy();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.entity).toBe("decision");
      expect(parsed.symbol).toBe("NVDA");
    });

    it("MCP tool: get_agent_activity executes via facade and does not leak NVDA", async () => {
      const res = await executeMcpTool("get_agent_activity", { subjectId: "UNKNOWN_SUBJECT" });
      expect(res.isError).toBeFalsy();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.activities.length).toBe(0);
    });
  });
});
