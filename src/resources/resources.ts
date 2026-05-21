import { Resource } from "@modelcontextprotocol/sdk/types.js";

export const RESOURCES: Resource[] = [
  {
    uri: "postgsail://postgsail_overview",
    name: "Sailing Logbook Data Guide",
    description:
      "Explains what sailing data is tracked (trips, stays, moorages, sensors) and what it means for the sailor. Includes units, terminology, and data freshness notes.",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://path-categories-guide",
    name: "Vessel Sensors Guide",
    description:
      "Reference of vessel sensor categories and SignalK paths: navigation, electrical, environment, tanks, propulsion. Useful for interpreting monitoring data.",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://mcp-tool-reference",
    name: "Sailing Assistant Tool Guide",
    description:
      "Maps common sailor questions to the right MCP tools. Includes tool chaining patterns and session-start rules for the AI assistant.",
    mimeType: "application/json",
  },
];