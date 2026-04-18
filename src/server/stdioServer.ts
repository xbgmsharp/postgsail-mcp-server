import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  CallToolRequestSchema,
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

// Initialize PostgSail client
const POSTGSAIL_API_URL =
  process.env.POSTGSAIL_API_URL || "http://localhost:3000/";
const POSTGSAIL_TOKEN = process.env.POSTGSAIL_TOKEN;

export async function startStdioServer() {
  // Initialize the MCP server
  const server = new Server(
    {
      name: "postgsail-server",
      version: "0.0.7",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    }
  );

  const pgsailClient = new PostgSailClient(POSTGSAIL_API_URL);
  // Initialize PostgSail client
  if (POSTGSAIL_TOKEN) {
    pgsailClient.setToken(POSTGSAIL_TOKEN);
    //console.error("PostgSailClient initialization successful via token");
  } else {
    console.log("PostgSailClient initialization without token");
    process.exit(1);
  }

  // Register handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: Object.values(PROMPTS),
  }));
  // Handle Resource Template calls - return empty for now
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [], // Return an empty array if no templates are available
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return handleToolCall(request.params, pgsailClient);
  });

  // Handle prompt calls
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return handlePromptCall(request);
  });

  // Handle resource calls
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return handleResourceCall(request);
  });

  // Start the STDIO server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  //console.error(
  //  "PostgSail MCP Server running in STDIO mode. Waiting for requests..."
  //);
}
