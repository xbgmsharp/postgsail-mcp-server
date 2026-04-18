import { Tool } from "@modelcontextprotocol/sdk/types.js";

// All tools are read-only: they only fetch data from the PostgSail API.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,      // does not modify any state
  destructiveHint: false,  // no destructive updates
  idempotentHint: true,    // same args always return same result
  openWorldHint: false,    // data comes only from the PostgSail API (closed world)
};

// Define available tools
const toolDefinitions: Tool[] = [
  {
    name: "get_vessels",
    title: "List user vessels",
    description:
      "Returns the list of vessels visible to the authenticated user, including identifiers, connectivity status, and recent telemetry timestamps. Use this tool first when the user refers to 'my vessel' without specifying which one.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_vessel",
    title: "Get vessel metadata",
    description:
      "Describes the vessel's dimensions (beam, length, height) and its ship_type (e.g., sailing, motor), country of registration, and user data (photo, make&model, polar), and other static information (platform,plugin version). This is useful for understanding the vessel's characteristics and capabilities.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: {},
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
          has_images: { type: "boolean" },
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
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: "get_logs",
    title: "Get logs",
    description:
      "Get a summary of all voyage logs (trips) with basic details like start/end times, distance, duration, and tags. This is useful for quickly browsing through past voyages and identifying ones of interest for deeper exploration.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (ISO format)" },
        end_date: { type: "string", description: "End date (ISO format)" },
        distance: {
          type: "number",
          description: "Filter logs by minimum distance (in nautical miles)",
          required: false,
        },
        duration: {
          type: "number",
          description: "Filter logs by minimum duration (in hours)",
          required: false,
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Filter logs by tags (e.g., ['maintenance', 'voyage'])",
          required: false,
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
          default: 0,
        },
      },
    },
    /*
    outputSchema: {
      type: "object", // Type '"array"' is not assignable to type '"object"'.ts(2322) (property) type: "array"
      items: {
        type: "object",
        properties: {
          id: { type: "integer", minimum: 1 },
          name: { type: "string" },
          from: { type: "string" },
          started: { type: "string", format: "date-time" },
          to: { type: "string" },
          ended: { type: "string", format: "date-time" },
          distance: { type: "number", minimum: 0 },
          duration: {
            type: "string",
            pattern: "^PT(?:\\d+H)?(?:\\d+M)?(?:\\d+(?:\\.\\d+)?S)?$",
          },
          _from_moorage_id: { type: "integer", minimum: 1 },
          _to_moorage_id: { type: "integer", minimum: 1 },
          tags: {
            type: ["array", "null"],
            items: { type: "string" },
          },
        },
      },
    },
    */
  },
  {
    name: "get_last_log",
    title: "Get last log details",
    description:
      "Get all details for the most recent voyage log, including the full track, sensor data, and moorage information. This is useful for quickly accessing the latest voyage information.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_log",
    title: "Get log details",
    description:
      "Get all details for specific voyage log by ID, including the full track, sensor data, and moorage information. This is useful for deep-diving into a particular voyage to analyze the route taken, conditions experienced, and moorings used.",
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
    description:
      "Export specific log track in various formats, gpx, geojson, kml",
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
    title: "Get moorages",
    description:
      "Get a summary of all moorages/marinas/anchorages, including location, type (anchor, dock, mooring buoy), and basic usage statistics. This is useful for identifying frequently used moorages and understanding their characteristics.",
    inputSchema: {
      type: "object",
      properties: {
        default_stay_type: {
          type: "string",
          enum: ["All", "Unknown", "Anchor", "Dock", "Mooring Buoy"],
          description: "Moorages Type Filter",
          default: "All",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_moorage",
    title: "Get moorage details",
    description:
      "Get all details for specific moorage by ID, including location, facilities, and usage statistics. This is useful for understanding the characteristics and availability of a particular moorage.",
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
    title: "Get moorage stays",
    description:
      "Get all stays at a specific moorage, including details like start/end times, duration, and type (anchor, dock, mooring buoy). This is useful for analyzing usage patterns at a particular moorage.",
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
    title: "Get stays",
    description:
      "Get a summary of all stays at moorages/marinas/anchorages with basic details like start/end times, duration, and type (anchor, dock, mooring buoy). This is useful for analyzing moorage usage patterns and identifying frequently used locations.",
    inputSchema: {
      type: "object",
      properties: {
        arrived: { type: "string", description: "Start date (ISO format)" },
        departed: { type: "string", description: "End date (ISO format)" },
        stay_type: {
          type: "string",
          enum: ["All", "Unknown", "Anchor", "Dock", "Mooring Buoy"],
          description: "Stays Type Filter",
          default: "All",
        },
        duration: {
          type: "number",
          description: "Filter stays by minimum duration (in hours)",
          required: false,
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_stay",
    title: "Get stay details",
    description:
      "Get all details for specific stay at moorage by ID, including the moorage information, duration, and type (anchor, dock, mooring buoy). This is useful for analyzing specific moorage events in detail to understand the conditions and context of each stay.",
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
    title: "Get live monitoring data",
    description:
      "Get current live monitoring data including sensors, position, and other real-time information. This is useful for monitoring the vessel's current status and environmental conditions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: {},
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
    description:
      "Get historical monitoring data for a predefined period. Provides access to past sensor readings limited in time range (24h,48h,72h,7days), which is useful for analyzing trends and conditions experienced during specific voyages or events.",
    inputSchema: {
      type: "object",
      properties: {
        time_interval: {
          type: "string",
          enum: ["24 hours", "48 hours", "72 hours", "7 days"],
          description: "predefined period Filter",
          default: "24 hours",
        },
      },
    },
  },
  {
    name: "get_profile",
    title: "Get user profile and preferences",
    description:
      "Get user profile and preferences including name, unit system (imperial/metric), alert thresholds (low battery, high wind, low depth, pressure drop), and notification settings. Useful for understanding how the user has configured their monitoring and what limits trigger alerts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
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
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
  },
  {
    name: "get_vessel_mapping",
    description:
      "Get vessel signalk path mapping configuration and the available keys. This is useful for understanding how the vessel's sensor data is mapped to specific signalk paths, which can help in interpreting the live and historical monitoring data correctly.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    outputSchema: {
      type: "object",
      properties: {
        type: {},
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
      },
    },
  },
  {
    name: "get_stats",
    description:
      "Get statistics data for specific timeframe, include aggregate of logs by speed,distance,duration and aggregate moorages by duration and arrival. Useful to analyze trends and performance over time.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (ISO format)" },
        end_date: { type: "string", description: "End date (ISO format)" },
      },
    },
  },
  {
    name: "get_timelapse_data",
    description:
      "Get timelapse/track data for visualization, including points or linestring formats to represent the vessel's movement over time.",
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
  {
    name: "get_event_logs",
    title: "Get event logs",
    description:
      "Get system event log entries including alerts, notifications, and significant vessel events. Useful for troubleshooting connectivity issues, reviewing alert history, and understanding what triggered notifications.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_badges",
    title: "Get vessel badges",
    description:
      "Get vessel achievements and earned badges based on voyage milestones (e.g., distance sailed, number of anchorages, night sailing). Useful for summarizing accomplishments.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_logs_by_day",
    title: "Get logs by day",
    description:
      "Get voyage activity aggregated by calendar day. Shows how many trips were made and total distance per day. Useful for detailed daily analysis and identifying patterns in daily sailing activity.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_logs_by_week",
    title: "Get logs by week",
    description:
      "Get voyage activity aggregated by calendar week. Shows how many trips were made and total distance per week. Useful for weekly analysis, identifying trends, and short-term summaries.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_logs_by_month",
    title: "Get logs by month",
    description:
      "Get voyage activity aggregated by calendar month. Shows how many trips were made and total distance per month. Useful for seasonal analysis, identifying peak sailing months, and yearly summaries.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_moorage_arrivals_departures",
    title: "Get moorage arrivals and departures",
    description:
      "Get all voyages (logs) that departed from or arrived at a specific moorage, identified by its ID. Useful for understanding traffic patterns at a particular location or tracing all trips associated with a home port or frequent stop.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Moorage ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_initial_context",
    description:
      "Get comprehensive PostgSail context and documentation to understand available data and usage patterns",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

export const tools: Tool[] = toolDefinitions.map((tool) => ({
  ...tool,
  annotations: { ...READ_ONLY_ANNOTATIONS, ...tool.annotations },
}));
