import { createServer } from "http";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools } from "../tools/tools.js";
import { RESOURCES } from "../resources/resources.js";
import { PROMPTS } from "../prompts/prompts.js";
import { handleToolCall } from "../tools/toolHandlers.js";
import { handlePromptCall } from "../prompts/promptHandlers.js";
import { handleResourceCall } from "../resources/resourceHandlers.js";
import PostgSailClient from "../client/postgsail-client.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger("HttpServer");

// Initialize PostgSail client
const POSTGSAIL_API_URL = process.env.POSTGSAIL_API_URL || "http://localhost:3000/";
const pgsailClient = new PostgSailClient(POSTGSAIL_API_URL);

// Store client tokens mapped to PostgSail clients
const clientTokens = new Map<string, PostgSailClient>();

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  if (typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    return parts.length > 1 ? parts[parts.length - 1].trim() : authHeader.trim();
  }

  return null;
}

/**
 * Authenticate and get or create a PostgSail client for the token
 */
async function getClientForToken(token: string): Promise<PostgSailClient> {
  logger.debug("Authenticating token", { token: token.substring(0, 8) + "..." });
  if (clientTokens.has(token)) {
    logger.debug("Returning cached client for token");
    return clientTokens.get(token)!;
  }

  const client = new PostgSailClient(POSTGSAIL_API_URL);
  client.setToken(token);

  try {
    const result = await client.getVessel();
    logger.success("Token validation successful for new client");
    clientTokens.set(token, client);
    return client;
  } catch (error: any) {
    logger.error("Token validation failed", error);
    throw new Error(`Invalid PostgSail token: ${error.message}`);
  }
}

/**
 * HTTP Server with Streamable transport support
 */
export async function startHttpServer() {
  const httpServer = createServer(async (req, res) => {
    // Enable CORS with MCP-specific headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, mcp-protocol-version, authorization"
    );
    res.setHeader("Access-Control-Expose-Headers", "mcp-protocol-version");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // Homepage - static HTML
    if (url.pathname === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PostgSail MCP Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .endpoint {
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
    }
    .info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    ul {
      margin: 10px 0;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <h1>⛵ PostgSail MCP Server</h1>

  <p>This is a Model Context Protocol server providing access to PostgSail marine vessel data and APIs.</p>

  <div class="info">
    <strong>🚀 Server Info</strong>
    <ul>
      <li><strong>Name:</strong> postgsail-server</li>
      <li><strong>Version:</strong> 0.0.6</li>
      <li><strong>Protocol:</strong> MCP (Model Context Protocol)</li>
      <li><strong>Transport:</strong> HTTP with JSON-RPC 2.0</li>
    </ul>
  </div>

  <div class="endpoint">
    <h3>📡 Endpoints</h3>
    <ul>
      <li><code>POST /mcp</code> - Main MCP endpoint (JSON-RPC 2.0)</li>
      <li><code>GET /health</code> - Health check endpoint</li>
      <li><code>GET /</code> - This page</li>
    </ul>
  </div>

  <div class="endpoint">
    <h3>🔧 Available Methods</h3>
    <ul>
      <li><strong>initialize</strong> - Initialize MCP connection</li>
      <li><strong>tools/list</strong> - List available tools (15 tools)</li>
      <li><strong>tools/call</strong> - Execute a tool (requires JWT authentication)</li>
      <li><strong>prompts/list</strong> - List available prompts (6 prompts)</li>
      <li><strong>prompts/get</strong> - Get a specific prompt</li>
      <li><strong>resources/list</strong> - List available resources (3 resources)</li>
      <li><strong>resources/read</strong> - Read a specific resource</li>
    </ul>
  </div>

  <div class="info">
    <strong>🔐 Authentication</strong>
    <p>Tool execution requires a valid PostgSail JWT token. Include it in the Authorization header:</p>
    <code>Authorization: Bearer YOUR_POSTGSAIL_MCP_JWT_TOKEN</code>
  </div>

  <div class="endpoint">
    <h3>📚 Example Request</h3>
    <pre><code>curl -X POST http://${req.headers.host}/mcp \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_MCP_TOKEN' \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'</code></pre>
  </div>

  <p style="text-align: center; color: #6b7280; margin-top: 40px;">
    <a href="https://github.com/xbgmsharp/postgsail" target="_blank" style="color: #2563eb; text-decoration: none;">PostgSail on GitHub</a> | 
    <a href="https://modelcontextprotocol.io" target="_blank" style="color: #2563eb; text-decoration: none;">MCP Documentation</a>
  </p>
</body>
</html>`); // Your HTML content
      return;
    }

    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          name: "postgsail-server",
          version: "0.0.6",
          transport: "http-streamable",
        })
      );
      return;
    }

    // MCP endpoint - handles JSON-RPC over HTTP
    if (url.pathname === "/mcp" && req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const request = JSON.parse(body);
          const { jsonrpc, id, method, params } = request;

          if (!method) {
            throw new Error("Method is required");
          }

          const requestStart = Date.now();
          const toolName = method === "tools/call" ? params?.name : undefined;
          const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ?? req.socket.remoteAddress ?? "unknown";
          const userAgent = req.headers["user-agent"] ?? "unknown";
          logger.info(`→ ${method}${toolName ? ` [${toolName}]` : ""} | ip=${clientIp} agent=${userAgent}`);

          let activeClient = pgsailClient;

          if (method === "tools/call") {
            const clientToken = extractToken(req);

            if (!clientToken) {
              logger.warn(`tools/call [${toolName}] rejected — no token provided | ip=${clientIp}`);
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id,
                  error: {
                    code: -32001,
                    message: "Authentication required. Provide PostgSail JWT token in Authorization header.",
                  },
                })
              );
              return;
            }

            try {
              activeClient = await getClientForToken(clientToken);
            } catch (error: any) {
              logger.warn(`tools/call [${toolName}] rejected — invalid token | ip=${clientIp}`, error);
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id,
                  error: {
                    code: -32001,
                    message: `Invalid or expired token: ${error.message}`,
                  },
                })
              );
              return;
            }
          }

          let result;

          switch (method) {
            case "initialize":
              result = {
                protocolVersion: "2025-06-18",
                capabilities: {
                  prompts: { listChanged: false },
                  resources: { subscribe: false, listChanged: false },
                  tools: { listChanged: false },
                },
                serverInfo: { name: "postgsail-server", version: "0.0.6" },
              };
              const timestamp = new Date().getTime();
              res.setHeader("mcp-session-id", `postgsail-session-${timestamp}`);
              if (params?.clientInfo) {
                logger.info(`client: ${params.clientInfo.name} ${params.clientInfo.version ?? ""}`.trim());
              }
              if (params?.protocolVersion) {
                logger.debug(`protocol: ${params.protocolVersion}`);
              }
              break;
            case "notifications/initialized":
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ jsonrpc: "2.0", id }));
              return;
            case "ping":
              result = {};
              break;
            case "tools/list":
              result = { tools };
              break;
            case "tools/call":
              result = await handleToolCall(params, activeClient);
              break;
            case "resources/templates/list":
              result = { resourceTemplates: [] };
              break;
            case "resources/list":
              result = { resources: RESOURCES };
              break;
            case "resources/read":
              result = await handleResourceCall({ method: "resources/read", params });
              break;
            case "prompts/list":
              result = { prompts: Object.values(PROMPTS) };
              break;
            case "prompts/get":
              result = await handlePromptCall({ method: "prompts/get", params });
              break;
            default:
              throw new Error(`Unknown method: ${method}`);
          }

          const elapsed = Date.now() - requestStart;
          logger.success(`← ${method}${toolName ? ` [${toolName}]` : ""} (${elapsed}ms)`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
        } catch (error: any) {
          logger.error("Request error", error);
          let requestId = null;
          try {
            const parsedRequest = JSON.parse(body);
            requestId = parsedRequest.id;
          } catch (e) {
            // Ignore parse errors in error handler
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id: requestId,
              error: {
                code: -32603,
                message: error.message || "Internal error",
              },
            })
          );
        }
      });
      return;
    }

    // 404 for unknown routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  return httpServer;
}
