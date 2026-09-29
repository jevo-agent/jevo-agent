import { z } from "zod";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "get_stock_state",
    description:
      "Retrieve canonical intelligence state, current rank, and Jev evaluation for a stock asset symbol.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Ticker symbol of the stock (e.g. 'NVDA', 'TSLA').",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "rank_stocks",
    description:
      "Retrieve ranked list of stocks ordered by opportunity score from the latest autonomous agent cycle.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of ranked opportunities to return.",
        },
        sort: {
          type: "string",
          enum: ["rank", "score"],
          description: "Sort by rank or raw opportunity score.",
        },
        decision: {
          type: "string",
          enum: ["promote", "hold", "demote"],
          description: "Filter by Jev decision.",
        },
      },
    },
  },
  {
    name: "get_pairing_candidates",
    description:
      "Retrieve operator-evaluated pairing candidates between equities and meme token concepts.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Filter pairings by parent equity symbol.",
        },
        limit: {
          type: "number",
          description: "Maximum number of pairing candidates to return.",
        },
      },
    },
  },
  {
    name: "get_jevo_decision",
    description:
      "Retrieve a specific Jev qualitative decision record and factor breakdown by decision ID or symbol.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Decision ID or equity symbol to inspect.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_agent_activity",
    description:
      "Retrieve recent memory and state transition activities performed by the autonomous agent without assuming hardcoded fallbacks.",
    inputSchema: {
      type: "object",
      properties: {
        subjectId: {
          type: "string",
          description: "Filter activity by subject ID (e.g. stock symbol or cycle ID).",
        },
        subjectType: {
          type: "string",
          description: "Filter activity by subject type (ASSET, PAIRING, LAUNCH, SYSTEM).",
        },
        limit: {
          type: "number",
          description: "Maximum number of activity events to return.",
        },
      },
    },
  },
];
