import { Resource } from "@modelcontextprotocol/sdk/types.js";

export const RESOURCES: Resource[] = [
  {
    uri: "postgsail://postgsail_overview",
    name: "PostgSail Overview",
    description: "Core concepts and data model structure of PostgSail",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://path-categories-guide",
    name: "SignalK Path Categories Guide",
    description: "Comprehensive reference of SignalK paths and their meanings",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://mcp-tool-reference",
    name: "MCP Tool Reference",
    description: "Guide to understanding and using MCP tools",
    mimeType: "application/json",
  },
];