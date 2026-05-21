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
    title: "Get voyage tracks as map data",
    description:
      "Retrieve recent voyage tracks as GeoJSON geographic line features for map rendering. " +
      "Use when the user wants to visualize, plot, or display their trips on a map. " +
      "Supports pagination to browse older tracks.",
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
    title: "Export voyage track file",
    description:
      "Export a specific voyage track as a downloadable file in GPX, GeoJSON, or KML format. " +
      "GPX works with GPS devices and navigation apps (e.g. Garmin, OpenCPN). " +
      "KML opens in Google Earth. GeoJSON works with web mapping tools. " +
      "Use when the user wants to save, share, or re-use a trip track.",
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
      "Get a summary of all moorages/marinas/anchorages, including location, " +
      "type (anchor, dock, mooring buoy), and basic usage statistics. " +
      "Use to find by stay type, list most visited anchorages, or browse all moorages. " +
      "Supports filtering by type and pagination.",
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
    title: "Get recent sensor history",
    description:
      "Retrieve historical sensor readings for the last 24h, 48h, 72h, or 7 days: " +
      "battery charge/voltage, solar power, wind speed/direction, water temperature, depth, " +
      "air temperature, humidity, and barometric pressure trend. " +
      "Use to answer: 'how was my battery yesterday?', 'what was the wind doing overnight?', " +
      "'show me the pressure trend over the last 3 days'.",
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
    name: "get_stats",
    title: "Get voyage statistics summary",
    description:
      "Get aggregated voyage statistics for a time period: total trips, total distance sailed (NM), " +
      "total time underway, personal records (max speed, max wind, longest passage), best 24h run, " +
      "and top moorages by arrivals and duration. " +
      "Use this to answer: 'how far have I sailed?', 'what was my best passage?', " +
      "'sailing summary for this year/season/month', 'how many trips did I do?', " +
      "'which countries have I visited?'. Defaults to all-time when no dates given.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start of period (ISO 8601). Omit for all-time." },
        end_date: { type: "string", description: "End of period (ISO 8601). Omit for all-time." },
      },
    },
  },
  {
    name: "get_timelapse_data",
    title: "Get vessel movement animation data",
    description:
      "Retrieve vessel GPS positions for a date range, formatted for timelapse replay or animation. " +
      "Returns either discrete GPS points or continuous track lines (linestring). " +
      "Use when the user wants to animate, replay, or visualize their movements over a specific period.",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start of period (ISO 8601). Omit for all-time." },
        endDate: { type: "string", description: "End of period (ISO 8601). Omit for all-time." },
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
    name: "find_anchorages_near",
    title: "Find anchorages near a location",
    description:
      "Find and search for anchorages, marinas, moorings, or docks near a given position. " +
      "Use when user asks: 'find a quiet anchorage near X', 'where can I anchor near Y', " +
      "'anchorages I haven't visited nearby', 'good shelter close to [place]', " +
      "'what moorages are around here'. " +
      "Requires lat/lon — resolve place names from context or prior knowledge first.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Center latitude (WGS84)" },
        longitude: { type: "number", description: "Center longitude (WGS84)" },
        radius_nm: { type: "number", description: "Search radius in nautical miles (default 50)", default: 50 },
        stay_type: {
          type: "string",
          enum: ["All", "Anchor", "Dock", "Mooring Buoy"],
          default: "All",
        },
        unvisited_only: {
          type: "boolean",
          description: "If true, only return moorages this vessel has never visited",
          default: false,
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "get_user_context",
    title: "Get sailor and vessel context",
    description:
      "Returns personalised sailing context: sailor name, vessel details, lifetime stats " +
      "(total trips, distance, countries), last 3 trips, favourite moorages, 30-day activity " +
      "metrics, and alert preferences. " +
      "PostgSail tracks: logbook (trips with GPS track, distance NM, speed knots), " +
      "stays (anchor/dock/mooring buoy periods), moorages (named places clustered within 300m), " +
      "and monitoring (live sensors: wind, depth, battery, solar, temperature, pressure, tanks). " +
      "Use when asked: 'what data do you have?', 'what can you tell me about my sailing?', " +
      "'overview of my history', or when the query needs broad sailing context to answer well.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_initial_context",
    title: "Get PostgSail context",
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
