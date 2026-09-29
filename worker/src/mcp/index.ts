import { jevoIntelligenceFacade, getProviderModeInfo } from "../intelligence/facade";
import { MCP_TOOLS, type McpToolDefinition } from "./tools";

export * from "./tools";

export interface McpToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Executes a requested MCP tool call by strictly delegating to the JevoIntelligenceFacade.
 * Contains no analysis or business logic in the MCP adapter layer.
 * Strictly read-only: no trading, wallet, or financial operations.
 */
export async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<McpToolCallResult> {
  try {
    switch (toolName) {
      case "get_stock_state": {
        const symbol = typeof args.symbol === "string" ? args.symbol : "";
        if (!symbol) {
          return {
            isError: true,
            content: [{ type: "text", text: "Error: 'symbol' string argument is required." }],
          };
        }
        const result = await jevoIntelligenceFacade.getStockState(symbol);
        if (!result) {
          return {
            isError: true,
            content: [{ type: "text", text: `Stock '${symbol}' not found.` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "rank_stocks": {
        const limit = typeof args.limit === "number" ? args.limit : undefined;
        const sort = args.sort === "score" || args.sort === "rank" ? args.sort : undefined;
        const decision = typeof args.decision === "string" ? args.decision : undefined;
        const results = await jevoIntelligenceFacade.getOpportunities({ limit, sort, decision });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  providerMode: getProviderModeInfo(),
                  total: results.length,
                  opportunities: results,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_pairing_candidates": {
        const symbol = typeof args.symbol === "string" ? args.symbol : undefined;
        const limit = typeof args.limit === "number" ? args.limit : undefined;
        const results = await jevoIntelligenceFacade.getPairings({ symbol, limit });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  providerMode: getProviderModeInfo(),
                  total: results.length,
                  pairings: results,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_jevo_decision": {
        const id = typeof args.id === "string" ? args.id : "";
        if (!id) {
          return {
            isError: true,
            content: [{ type: "text", text: "Error: 'id' string argument is required." }],
          };
        }
        const result = await jevoIntelligenceFacade.getDecision(id);
        if (!result) {
          return {
            isError: true,
            content: [{ type: "text", text: `Decision '${id}' not found.` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_agent_activity": {
        const subjectId = typeof args.subjectId === "string" ? args.subjectId : undefined;
        const subjectType = typeof args.subjectType === "string" ? args.subjectType : undefined;
        const limit = typeof args.limit === "number" ? args.limit : undefined;
        const results = await jevoIntelligenceFacade.getActivity({ subjectId, subjectType, limit });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  providerMode: getProviderModeInfo(),
                  total: results.length,
                  activities: results,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown MCP tool: '${toolName}'` }],
        };
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool '${toolName}': ${(error as Error).message}`,
        },
      ],
    };
  }
}
