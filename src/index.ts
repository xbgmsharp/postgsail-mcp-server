#!/usr/bin/env node

/**
 * PostgSail MCP Server
 * Provides Claude with access to PostgSail marine data APIs
 * $ DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector
 * * STDIO transport: command=/usr/local/bin/npx, args=tsx,src/index.ts
 *
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ErrorCode,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  Tool,
  Resource,
  Prompt,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import PostgSailClient from "./postgsail-client.js";

// Initialize environment variables
const POSTGSAIL_URL =
  process.env.POSTGSAIL_URL || "http://localhost:3000/";
const POSTGSAIL_TOKEN = process.env.POSTGSAIL_TOKEN;
const POSTGSAIL_USER = process.env.POSTGSAIL_USER;
const POSTGSAIL_PASS = process.env.POSTGSAIL_PASS;
const POSTGSAIL_VERBOSE = process.env.POSTGSAIL_VERBOSE;
const POSTGSAIL_DEBUG = process.env.POSTGSAIL_DEBUG;

if (!POSTGSAIL_URL) {
  console.error("POSTGSAIL_URL environment variable is required");
  process.exit(1);
}

if (!POSTGSAIL_TOKEN) {
  console.error("POSTGSAIL_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize PostgSail client
const pgsailClient = new PostgSailClient(POSTGSAIL_URL, POSTGSAIL_TOKEN);
console.error("PostgSailClient initialization...");
console.error(
  `${POSTGSAIL_URL} ${POSTGSAIL_USER} ${POSTGSAIL_PASS} ${POSTGSAIL_TOKEN}`
);
if (POSTGSAIL_TOKEN) {
  pgsailClient.setToken(POSTGSAIL_TOKEN);
  console.error("PostgSailClient initialization successful via token");
} else if (POSTGSAIL_USER && POSTGSAIL_PASS) {
  const jwt = await pgsailClient.login(POSTGSAIL_USER, POSTGSAIL_PASS);
  if (jwt?.token) {
    pgsailClient.setToken(jwt.token);
    console.error("PostgSailClient initialization successful via login");
  } else {
    console.error("Failed to authenticate with PostgSail");
    process.exit(1);
  }
} else {
  console.error("Failed to authenticate with PostgSail");
  process.exit(1);
}

// Define available tools
const tools: Tool[] = [
  {
    name: "get_vessel",
    title: "Get Vessel Information",
    description: "Get current vessel information",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        required: [
          "name",
          "geojson",
          "offline",
          "has_image",
          "has_polar",
          "image_url",
          "vessel_id",
          "created_at",
          "last_contact",
          "configuration",
          "first_contact",
          "plugin_version",
          "signalk_version",
          "image_updated_at",
        ],
        properties: {
          beam: { type: "number" },
          mmsi: { type: "string", pattern: "^\\d{9}$" },
          name: { type: "string" },
          height: { type: "number" },
          length: { type: "number" },
          alpha_2: { type: "string", minLength: 2, maxLength: 2 },
          country: { type: "string" },
          offline: { type: "boolean" },
          platform: { type: "string" },
          has_image: { type: "boolean" },
          has_polar: { type: "boolean" },
          image_url: { type: "string", format: "uri-reference" },
          ship_type: {
            type: "string",
            enum: ["Sailing", "Motor", "Cargo", "Fishing", "Tanker", "Other"],
          },
          vessel_id: { type: "string", pattern: "^[a-f0-9]{16,}$" },
          created_at: { type: "string", format: "date-time" },
          make_model: { type: "string" },
          last_contact: { type: "string", format: "date-time" },
          configuration: { type: "boolean" },
          first_contact: { type: "string", format: "date-time" },
          plugin_version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
          image_updated_at: { type: "string", format: "date-time" },
          geojson: {
            type: "object",
            required: ["type", "geometry", "properties"],
            properties: {
              type: {
                type: "string",
                const: "Feature",
              },
              geometry: {
                type: "object",
                required: ["type", "coordinates"],
                properties: {
                  type: {
                    type: "string",
                    const: "Point",
                  },
                  coordinates: {
                    type: "array",
                    items: [
                      {
                        type: "number",
                        minimum: -180,
                        maximum: 180,
                      },
                      {
                        type: "number",
                        minimum: -90,
                        maximum: 90,
                      },
                    ],
                    minItems: 2,
                    maxItems: 2,
                  },
                },
              },
            },
          },
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: "get_logs",
    description: "Get a summary of voyages or logs or trips",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      items: {
        type: "object",
        required: [
          "id",
          "name",
          "from",
          "started",
          "to",
          "ended",
          "distance",
          "duration",
          "_from_moorage_id",
          "_to_moorage_id",
        ],
        properties: {
          id: {
            type: "integer",
            minimum: 1,
          },
          name: {
            type: "string",
          },
          from: {
            type: "string",
          },
          started: {
            type: "string",
            format: "date-time",
          },
          to: {
            type: "string",
          },
          ended: {
            type: "string",
            format: "date-time",
          },
          distance: {
            type: "number",
            minimum: 0,
          },
          duration: {
            type: "string",
            pattern: "^PT(?:\\d+H)?(?:\\d+M)?(?:\\d+(?:\\.\\d+)?S)?$",
          },
          _from_moorage_id: {
            type: "integer",
            minimum: 1,
          },
          _to_moorage_id: {
            type: "integer",
            minimum: 1,
          },
          tags: {
            type: ["array", "null"],
            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
  {
    name: "get_log",
    description: "Get all details for specific voyage log by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Log ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_logs_geojson",
    description: "Get recent voyage logs as GeoJSON for mapping",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (default: 1)",
          default: 1,
        },
      },
    },
  },
  {
    name: "export_log_track",
    description: "Export specific log track in various formats",
    inputSchema: {
      type: "object",
      properties: {
        logId: { type: "string", description: "Log ID to export" },
        format: {
          type: "string",
          enum: ["gpx", "geojson", "kml"],
          description: "Export format",
        },
      },
      required: ["logId", "format"],
    },
  },
  {
    name: "get_moorages",
    description: "Get a summary of all moorages/marinas/anchorages",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_moorage",
    description: "Get all details for specific moorage by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Moorage ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_moorage_stays",
    description: "Get all stays at a specific moorage",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Moorage ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_stays",
    description: "Get a summary of all stays (times at anchor/dock)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_stay",
    description: "Get all details for specific stay by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Stay ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_monitoring_live",
    description: "Get current live monitoring data (sensors, position, etc.)",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        required: ["time", "offline", "data", "geojson", "name", "status"],
        properties: {
          time: {
            type: "string",
            format: "date-time",
          },
          offline: {
            type: "boolean",
          },
          name: {
            type: "string",
          },
          status: {
            type: "string",
          },
          watertemperature: {
            type: ["number", "null"],
          },
          insidetemperature: {
            type: ["number", "null"],
          },
          outsidetemperature: {
            type: ["number", "null"],
          },
          windspeedoverground: {
            type: ["number", "null"],
          },
          winddirectiontrue: {
            type: ["number", "null"],
          },
          insidehumidity: {
            type: ["number", "null"],
          },
          outsidehumidity: {
            type: ["number", "null"],
          },
          outsidepressure: {
            type: ["number", "null"],
          },
          insidepressure: {
            type: ["number", "null"],
          },
          batterycharge: {
            type: ["number", "null"],
          },
          batteryvoltage: {
            type: ["number", "null"],
          },
          depth: {
            type: ["number", "null"],
          },
          solarpower: {
            type: ["number", "null"],
          },
          solarvoltage: {
            type: ["number", "null"],
          },
          tanklevel: {
            type: ["number", "null"],
          },
          outsidepressurehistory: {
            type: ["array", "null"],
          },
          geojson: {
            type: "object",
            required: ["type", "geometry", "properties"],
            properties: {
              type: {
                type: "string",
                const: "Feature",
              },
              geometry: {
                type: "object",
                required: ["type", "coordinates"],
                properties: {
                  type: {
                    type: "string",
                    const: "Point",
                  },
                  coordinates: {
                    type: "array",
                    items: [
                      {
                        type: "number",
                        minimum: -180,
                        maximum: 180,
                      },
                      {
                        type: "number",
                        minimum: -90,
                        maximum: 90,
                      },
                    ],
                    minItems: 2,
                    maxItems: 2,
                  },
                },
              },
              properties: {
                type: "object",
                required: ["name", "time", "latitude", "longitude"],
                properties: {
                  name: { type: "string" },
                  time: { type: "string", format: "date-time" },
                  status: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  truewindspeed: { type: ["number", "string", "null"] },
                  speedoverground: { type: ["number", "null"] },
                  truewinddirection: { type: ["number", "string", "null"] },
                  windspeedapparent: { type: ["number", "null"] },
                },
              },
            },
          },
          live: {
            type: "object",
            required: ["type", "features"],
            properties: {
              type: {
                type: "string",
                const: "FeatureCollection",
              },
              features: {
                type: "array",
                items: {
                  type: "object",
                  required: ["type", "geometry", "properties"],
                  properties: {
                    type: {
                      type: "string",
                    },
                    geometry: {
                      type: "object",
                      required: ["type", "coordinates"],
                      properties: {
                        type: {
                          type: "string",
                        },
                        coordinates: {
                          type: "array",
                          items: { type: "array", items: { type: "number" } },
                        },
                      },
                    },
                    properties: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          data: {
            type: "object",
            properties: {
              cog: { type: ["number", "null"] },
              sog: { type: ["number", "null"] },
              heading: { type: ["number", "null"] },
              battery: {
                type: "object",
                properties: {
                  charge: { type: ["number", "null"] },
                  voltage: { type: ["number", "null"] },
                },
              },
              solar: {
                type: "object",
                properties: {
                  power: { type: ["number", "null"] },
                  voltage: { type: ["number", "null"] },
                },
              },
              wind: {
                type: "object",
                properties: {
                  speed: { type: ["number", "null"] },
                  direction: { type: ["number", "null"] },
                },
              },
              water: {
                type: "object",
                properties: {
                  depth: { type: ["number", "null"] },
                  temperature: { type: ["number", "null"] },
                },
              },
              humidity: {
                type: "object",
                properties: {
                  inside: { type: ["number", "null"] },
                  outside: { type: ["number", "null"] },
                },
              },
              presure: {
                type: "object",
                properties: {
                  inside: { type: ["number", "null"] },
                  outside: { type: ["number", "null"] },
                },
              },
              temperature: {
                type: "object",
                properties: {
                  inside: { type: ["number", "null"] },
                  outside: { type: ["number", "null"] },
                },
              },
              tank: {
                type: "object",
                properties: {
                  level: { type: ["number", "null"] },
                },
              },
              anchor: {
                type: "object",
                properties: {
                  radius: { type: ["number", "null"] },
                  position: {
                    type: ["array", "null"],
                    items: { type: "number" },
                  },
                },
              },
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
  {
    name: "get_monitoring_history",
    description: "Get historical monitoring data for specific timeframe",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date (ISO format)" },
        endDate: { type: "string", description: "End date (ISO format)" },
        sensors: {
          type: "array",
          items: { type: "string" },
          description: "Specific sensors to query (optional)",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  /*
  {
    name: "get_settings",
    description: "Get user settings",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        required: [
          "first",
          "last",
          "username",
          "has_vessel",
          "created_at",
          "preferences",
        ],
        properties: {
          first: { type: "string" },
          last: { type: "string" },
          username: { type: "string" },
          has_vessel: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          preferences: {
            type: "object",
            properties: {
              windy_last_metric: { type: "string" },
              use_imperial_units: { type: "boolean" },
              alarms: {
                type: "object",
                patternProperties: {
                  "^.*$": {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      value: { type: "number" },
                    },
                    required: ["date", "value"],
                  },
                },
              },

              badges: {
                type: "object",
                patternProperties: {
                  "^.*$": {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      log: { type: "integer" },
                    },
                    required: ["date"],
                  },
                },
              },

              alerting: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  low_pressure_threshold: { type: "number" },
                  high_wind_speed_threshold: { type: "number" },
                  low_water_depth_threshold: { type: "number" },
                  min_notification_interval: { type: "number" },
                  high_pressure_drop_threshold: { type: "number" },
                  low_battery_charge_threshold: { type: "number" },
                  low_battery_voltage_threshold: { type: "number" },
                  low_water_temperature_threshold: { type: "number" },
                  low_indoor_temperature_threshold: { type: "number" },
                  low_outdoor_temperature_threshold: { type: "number" },
                },
                additionalProperties: true,
              },
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
        additionalProperties: true,
      },
    },
  },
  */
  {
    name: "get_vessel_mapping",
    description:
      "Get vessel signalk path mapping configuration and the available keys",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        required: ["configuration"],
        properties: {
          configuration: {
            type: "object",
            properties: {
              updated_at: { type: "string", format: "date-time" },
              depthKey: { type: "string" },
              voltageKey: { type: "string" },
              windSpeedKey: { type: "string" },
              stateOfChargeKey: { type: "string" },
              windDirectionKey: { type: "string" },
              insideHumidityKey: { type: "string" },
              insidePressureKey: { type: "string" },
              outsideHumidityKey: { type: "string" },
              outsidePressureKey: { type: "string" },
              waterTemperatureKey: { type: "string" },
              insideTemperatureKey: { type: "string" },
              outsideTemperatureKey: { type: "string" },
              solarPowerKey: { type: "string" },
              solarVoltageKey: { type: "string" },
              tankLevelKey: { type: "string" },
              additionalProperties: true,
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
  },
  /*
  {
    name: "get_vessel_stats",
    description: "Get vessel statistics and analytics",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["logs", "moorages", "general"],
          description: "Type of statistics to retrieve",
        },
        timeframe: {
          type: "string",
          description:
            "Time period for stats (e.g., 'last_month', 'this_year')",
        },
      },
    },
  },
  */
  {
    name: "get_timelapse_data",
    description: "Get timelapse/track data for visualization",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date (ISO format)" },
        endDate: { type: "string", description: "End date (ISO format)" },
        format: {
          type: "string",
          enum: ["points", "linestring"],
          description: "Data format for visualization",
          default: "points",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  /*
  {
    name: "get_event_logs",
    description: "Get system event logs and alerts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_badges",
    description: "Get vessel achievements and badges",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  */
];

// MCP Server setup
const server = new Server(
  {
    name: "postgsail-server",
    version: "0.0.3",
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

const RESOURCES: Resource[] = [
  {
    uri: "postgsail://postgsail_overview",
    name: "PostgSail Overview",
    description:
      "Core concepts and data model structure of SignalK's PostgSail",
    mimeType: "application/json",
  },
  {
    uri: "https://api.openplotter.cloud/",
    name: "PostgSail OpenAPI Specification",
    description:
      "This provides a list of all endpoints (tables, foreign tables, views, functions), along with supported HTTP verbs and example payloads",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://data_model_reference",
    name: "SignalK Data Model Reference",
    description: "Comprehensive reference of SignalK paths and their meanings",
    mimeType: "application/json",
  },
  {
    uri: "postgsail://path_categories_guide",
    name: "SignalK Path Categories Guide",
    description: "Guide to understanding and categorizing SignalK paths",
    mimeType: "application/json",
  },
];

// Handle list resources tools request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES,
  };
});

const PROMPTS = {
  "vessel-system-status": {
    name: "vessel-system-status",
    description: "🛥️ Give me a summary of my current systems status.",
    arguments: [],
  },
  "stay-duration-analysis": {
    name: "stay-duration-analysis",
    description: "📍 Where did we stay the longest during {{month}}?",
    arguments: [
      {
        name: "month",
        description: "Month to analyze stay duration for",
        required: true,
      },
    ],
  },
  "anchor-stay-history": {
    name: "anchor-stay-history",
    description: "⚓ Show me all anchorages we used last month.",
    arguments: [
      {
        name: "month",
        description: "Month to analyze stay duration for",
        required: true,
      },
    ],
  },
  "last-logbook-summary": {
    name: "last-logbook-summary",
    description: "🧾 Summarize my last voyage log.",
    arguments: [],
  },
  "logbook-summary": {
    name: "logbook-summary",
    description: "🧾 Summarize the voyage logs for the last month.",
    arguments: [],
  },
  "system-monitoring": {
    name: "system-monitoring",
    description: "🔧 List any alerts or events from the vessel today.",
    arguments: [],
  },
};

// Handle List prompts request
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: Object.values(PROMPTS),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_vessel":
        const vessel = await pgsailClient.getVessel();
        if (!vessel || !vessel?.vessel) {
          throw new Error("No vessel data found");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(vessel.vessel, null, 2),
            },
          ],
        };

      case "get_logs":
        const logs = await pgsailClient.getLogs();
        if (!Array.isArray(logs)) {
          throw new Error("Invalid logbooks data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(logs, null, 2),
            },
          ],
        };

      case "get_log":
        if (!args?.id) {
          throw new Error("Log ID is required");
        }
        const logData = await pgsailClient.getLog(args.id as string);
        if (!Array.isArray(logData)) {
          throw new Error("Invalid logbook data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(logData, null, 2),
            },
          ],
        };
      /*
      case "get_logs_geojson":
        const page = (args.page as number) || 1;
        const geoJsonData = await pgsailClient.getLogsMap(page);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(geoJsonData, null, 2),
            },
          ],
        };

      case "export_log_track":
        if (!args.logId || !args.format) {
          throw new Error("Log ID and format are required");
        }
        let trackData;
        if (args.format === "gpx") {
          trackData = await pgsailClient.exportLogGPX(args.logId as string);
        } else if (args.format === "geojson") {
          trackData = await pgsailClient.exportLogGeoJSON(args.logId as string);
        } else if (args.format === "kml") {
          trackData = await pgsailClient.exportLogKML(args.logId as string);
        } else {
          throw new Error("Invalid format. Use 'gpx' or 'geojson' or 'kml'.");
        }
        return {
          content: [
            {
              type: "text",
              text:
                typeof trackData === "string"
                  ? trackData
                  : JSON.stringify(trackData, null, 2),
            },
          ],
        };
*/
      case "get_moorages":
        const moorages = await pgsailClient.getMoorages();
        if (!Array.isArray(moorages)) {
          throw new Error("Invalid live monitoring data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(moorages, null, 2),
            },
          ],
        };

      case "get_moorage":
        if (!args?.id) {
          throw new Error("Moorage ID is required");
        }
        const moorageData = await pgsailClient.getMoorage(args.id as string);
        if (!Array.isArray(moorageData)) {
          throw new Error("Invalid moorage data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(moorageData, null, 2),
            },
          ],
        };

      case "get_moorage_stays":
        if (!args?.id) {
          throw new Error("Moorage ID is required");
        }
        const MoorageStaysData = await pgsailClient.getMoorageStays(
          args.id as string
        );
        if (!Array.isArray(MoorageStaysData)) {
          throw new Error("Invalid moorage stays data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(MoorageStaysData, null, 2),
            },
          ],
        };

      case "get_stays":
        const stays = await pgsailClient.getStays();
        if (!Array.isArray(stays)) {
          throw new Error("Invalid stays data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stays, null, 2),
            },
          ],
        };

      case "get_stay":
        if (!args?.id) {
          throw new Error("Stay ID is required");
        }
        const stayData = await pgsailClient.getStay(args.id as string);
        if (!Array.isArray(stayData)) {
          throw new Error("Invalid stay data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stayData, null, 2),
            },
          ],
        };

      case "get_monitoring_live":
        let liveData = await pgsailClient.getMonitoringLive();
        if (!Array.isArray(liveData) && !liveData[0]) {
          throw new Error("Invalid live monitoring data");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(liveData[0], null, 2),
            },
          ],
        };
      /*
      case "get_monitoring_history":
        if (!args.startDate || !args.endDate) {
          throw new Error("Start date and end date are required");
        }
        const historyPayload = {
          start_date: args.startDate,
          end_date: args.endDate,
          sensors: args.sensors || [],
        };
        const historyData = await pgsailClient.getMonitoringHistory(
          historyPayload
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(historyData, null, 2),
            },
          ],
        };

      case "get_vessel_stats":
        let statsData;
        if (args.type === "logs") {
          statsData = await pgsailClient.getStatsLogs();
        } else if (args.type === "moorages") {
          statsData = await pgsailClient.getStatsMoorages();
        } else {
          statsData = await pgsailClient.getStats({
            timeframe: args.timeframe || "all",
          });
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(statsData, null, 2),
            },
          ],
        };

      case "get_timelapse_data":
        if (!args.startDate || !args.endDate) {
          throw new Error("Start date and end date are required");
        }
        const timelapseQuery = `start_date=${args.startDate}&end_date=${args.endDate}`;
        const timelapseData = await pgsailClient.getTimelapseTrips(
          timelapseQuery
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(timelapseData, null, 2),
            },
          ],
        };
*/
      case "get_event_logs":
        const eventLogs = await pgsailClient.getEventLogs();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(eventLogs, null, 2),
            },
          ],
        };

      case "get_badges":
        const badges = await pgsailClient.getBadges();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(badges, null, 2),
            },
          ],
        };

      case "get_settings":
        const settings = await pgsailClient.getSettings();
        if (!settings || !settings?.settings) {
          throw new Error("No vessel data found");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(settings.settings, null, 2),
            },
          ],
        };

      case "get_vessel_mapping":
        const mapping = await pgsailClient.getVesselMapping();
        if (!Array.isArray(mapping) && !mapping[0]) {
          throw new Error("Invalid vessel mapping data");
        }
        if (!mapping[0]?.configuration) {
          throw new Error("No vessel data found");
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mapping[0], null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

// Handle Prompt calls
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "vessel-system-status":
        const vessels = await pgsailClient.getVessel();
        return {
          description:
            "Give me a summary of {{vessel_name}}’s current systems status.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: `Provide a daily briefing of my boat's systems`,
              },
            },
          ],
        };

      case "system-monitoring":
        const system = await pgsailClient.getMonitoringLive();
        return {
          description: "🔧 List any alerts or events from the vessel today.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: `List any alerts or events from the vessel today.`,
              },
            },
          ],
        };

      case "last-logbook-summary":
        const logData = await pgsailClient.getLastLog();
        return {
          description: "Summarize my last voyage log.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: `Summarize my last voyage log.`,
              },
            },
          ],
        };

      case "logbook-summary":
        const logs = await pgsailClient.getLogs();
        return {
          description: "Summarize the voyage logs for the last month.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: `Summarize the voyage logs for the last month.`,
              },
            },
          ],
        };
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

const resourcesMap: Map<string, any> = new Map();
// Handle Resource calls
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    // Check if it's a resource
    const resourceContent = resourcesMap.get(uri);
    if (resourceContent) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(resourceContent, null, 2),
          },
        ],
      };
    }

    // Unknown resource
    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Resource read failed: ${error.message}`
    );
  }
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Only log to stderr to avoid interfering with stdio communication
    console.error("PostgSail MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
