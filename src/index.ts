#!/usr/bin/env node

/**
 * Invapi MCP Server
 *
 * MCP server for the Invapi E-Invoicing API.
 * Provides tools for invoice conversion (JSON, UBL, CII, XLSX, ZUGFeRD),
 * validation (XRechnung / EN 16931), and extraction from PDFs and images.
 *
 * Requires the INVAPI_API_KEY environment variable.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerConversionTools } from "./tools/conversion.js";
import { registerValidationTools } from "./tools/validation.js";
import { registerExtractionTools } from "./tools/extraction.js";
import { registerUserTools } from "./tools/user.js";
import { registerBatchTools } from "./tools/batch.js";

const server = new McpServer({
  name: "@invapi/mcp-server",
  version: "1.0.0",
});

// Register all tool groups
registerConversionTools(server);
registerValidationTools(server);
registerExtractionTools(server);
registerUserTools(server);
registerBatchTools(server);

// Start with stdio transport
async function main(): Promise<void> {
  if (!process.env.INVAPI_API_KEY) {
    console.error("ERROR: INVAPI_API_KEY environment variable is required.");
    console.error("Get your API key at https://invapi.org");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Invapi MCP server running (stdio)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
