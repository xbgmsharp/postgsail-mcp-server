#!/usr/bin/env node

/**
 * PostgSail MCP Server
 * Provides Claude with access to PostgSail marine data APIs
 * $ MCP_AUTO_OPEN_ENABLED=false HOST=0.0.0.0 DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector
 * * STDIO transport: command=/usr/local/bin/npx, args=tsx,src/index.ts
 * * HTTP transport: url=http://localhost:3001/mcp
 * * MCP_TRANSPORT=http node dist/index.js
 *
 * This server bridges PostgSail marine data systems with AI agents allowing a read-only access to PostgSail marine data systems.
 *
 */

import { startHttpServer } from "./server/httpServer.js";
import { startStdioServer } from "./server/stdioServer.js";
import { loadResources } from "./resources/resourceHandlers.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("Main");

const POSTGSAIL_API_URL =
  process.env.POSTGSAIL_API_URL || "http://localhost:3000/";
const PORT = process.env.PORT || 3001;

if (!POSTGSAIL_API_URL) {
  logger.error("POSTGSAIL_API_URL environment variable is required");
  process.exit(1);
}

async function main() {
  try {
    await loadResources();

    const transport = process.env.MCP_TRANSPORT || "http";

    if (transport === "stdio") {
      await startStdioServer();
    } else {
      const httpServer = await startHttpServer();
      logger.info("POSTGSAIL_API_URL", { url: POSTGSAIL_API_URL });
      httpServer.listen(PORT, () => {
        logger.success(`PostgSail MCP Server running on http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Server error", error);
  process.exit(1);
});
