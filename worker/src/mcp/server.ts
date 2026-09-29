import path from "node:path";
import dotenv from "dotenv";

// 1. Resolve path to worker/.env using import.meta.dir (independent of process.cwd())
// This replicates the dotenv.config() mechanism used across the worker, but guarantees
// that working directory variations (e.g. when spawned by Claude Desktop) still find worker/.env.
const workerEnvPath = path.resolve(import.meta.dir, "../../.env");
dotenv.config({ path: workerEnvPath });

// Validate environment via existing worker schema
import "../config/env";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCP_TOOLS } from "./tools";
import { executeMcpTool } from "./index";

async function runServer() {
  const server = new Server(
    {
      name: "jevo-intelligence",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // List all available read-only intelligence tools (wires directly to existing MCP_TOOLS)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS,
    };
  });

  // Delegate tool execution directly to existing executeMcpTool / JevoIntelligenceFacade
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const res = await executeMcpTool(name, args ?? {});
    return {
      content: res.content,
      isError: res.isError,
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Fatal error starting Jevo MCP server:", error);
  process.exit(1);
});
