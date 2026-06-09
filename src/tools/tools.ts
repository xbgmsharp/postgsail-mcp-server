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
      "Returns the vessel's dimensions (beam, length, height), ship type (sailing, motor, etc.), country of registration, make/model, platform/plugin version, it may include vessel image and specifications if present.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_vessel_polar",
    title: "Get vessel Polar metadata",
    description:
      "Returns the vessel's Polar (CSV) data if present in an OCR format. Useful for performance analysis and optimization.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_logs",
    title: "List voyage logs",
    description:
      "List voyage logs (trips) with start/end times, distance, duration, and tags. Supports filtering by date range, minimum distance, minimum duration, and tags. Use to browse past voyages or narrow down to specific trips.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (ISO format)" },
        end_date: { type: "string", description: "End date (ISO format)" },
        distance: {
          type: "number",
          description: "Filter logs by minimum distance (in nautical miles)",
        },
        duration: {
          type: "number",
          description: "Filter logs by minimum duration (in hours)",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Filter logs by tags (e.g., ['maintenance', 'voyage'])",
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
    name: "get_last_log",
    title: "Get last log details",
    description:
      "Get full details for the vessel's most recent voyage log: GPS track (GeoJSON), distance (NM), " +
      "duration, average and max speed (knots), max wind speed (TWS knots), departure and " +
      "arrival moorage names and IDs, and per-point sensor time-series (COG, SOG, depth, " +
      "wind speed/direction, water temperature, battery, solar, pressure, heading, tank level). " +
      "Use to answer questions about a specific trip or to obtain moorage IDs for follow-up calls.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_log",
    title: "Get log details",
    description:
      "Get full details for a specific voyage log by ID: GPS track (GeoJSON), distance (NM), " +
      "duration, average and max speed (knots), max wind speed (TWS knots), departure and " +
      "arrival moorage names and IDs, and per-point sensor time-series (COG, SOG, depth, " +
      "wind speed/direction, water temperature, battery, solar, pressure, heading, tank level). " +
      "Use to answer questions about a specific trip or to obtain moorage IDs for follow-up calls.",
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
    title: "List visited moorages",
    description:
      "List all moorages (anchorages, marinas, mooring buoys) the vessel has visited, " +
      "with location, stay type, and usage statistics. " +
      "Supports filtering by type (anchor, dock, mooring buoy) and pagination.",
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
      "Get full details for a specific moorage by ID: location, stay type, and usage statistics.",
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
    title: "Get all stays at one moorage",
    description:
      "Get the chronological list of every stay recorded at a specific moorage, " +
      "identified by moorage ID. Returns stay type and duration alongside the " +
      "inbound log (which voyage arrived here) and the outbound log (which voyage departed from here). " +
      "Prefer this over get_stays when you already have a moorage ID and want its full visit history. " +
      "Use for single-location questions: 'how many times have I been to this anchorage?', " +
      "'how long did I spend here in total?', 'what trip brought me here last time?'.",
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
    title: "List stays",
    description:
      "List all stays across every moorage, with arrival/departure times, duration, " +
      "and stay type (Anchor, Dock, Mooring Buoy). " +
      "Each stay also includes the preceding log (what voyage brought you there) " +
      "and the following log (what voyage you left on). " +
      "Supports filtering by date range (arrived/departed), minimum duration, stay type, and pagination. " +
      "Use for cross-location questions: 'show me all my anchor stays last month', " +
      "'longest stays this year', 'time spent docked vs anchored'.",
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
      "Get full details for a specific stay by ID: moorage information, arrival/departure times, duration, and stay type (anchor, dock, mooring buoy).",
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
    title: "Get live vessel position and sensors",
    description:
      "Get the vessel's latest position, speed, heading, and sensor readings: wind, depth, battery, solar, temperature, humidity, pressure, and tank levels. Use to answer questions about where the vessel is now or its current conditions.",
    inputSchema: {
      type: "object",
      properties: {},
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
      "Use when the user wants to animate, replay, or visualize their movements over a specific period. " +
      "Requires explicit start and end dates.",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start of period (ISO 8601). Omit for all-time." },
        endDate: { type: "string", description: "End of period (ISO 8601). Omit for all-time." },
        format: {
          type: "string",
          enum: ["points", "linestring"],
          description: "'points' returns discrete GPS positions for an animated dot replay;\n'linestring' returns a continuous track line for drawing a route on a map.",
          default: "points",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "get_badges",
    title: "Get sailing achievement badges",
    description:
      "Get achievements and earned badges based on voyage milestones: distance sailed, number of anchorages visited, night sailing, and other accomplishments.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_moorage_arrivals_departures",
    title: "Get moorage arrivals and departures",
    description:
      "Get all voyage logs that departed from or arrived at a specific moorage, identified by its ID. " +
      "Returns log IDs, names, start/end times, and distance for each matching trip. " +
      "Use when asked: 'which trips started from my home port?', 'what voyages brought me to this anchorage?', " +
      "'show me every trip that passed through [place]', 'trace all routes to/from this marina'. " +
      "Obtain the moorage ID first from get_moorages, get_moorage, or get_log.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Moorage ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_engine_hours",
    title: "Get engine hours and service status",
    description:
      "Returns engine runtime statistics for the current vessel, computed from " +
      "SignalK propulsion.%.runTime data stored per logbook entry.\n\n" +
      "Returns four fields:\n" +
      "• total_engine_hours: lifetime engine hours across all logbook entries.\n" +
      "• last_30d_hours: engine hours in the last 30 days — useful for recent usage trends.\n" +
      "• estimated_service_due_hours: the configured service interval in hours " +
      "  (default 200h, overridable via vessel preferences). Compare against " +
      "  total_engine_hours to determine if service is overdue.\n" +
      "• hours_since_last_service: always null until last service date is recorded " +
      "  in the vessel settings — tell the user to log their last service if this is null.\n\n" +
      "Returns null for all fields if the vessel has no logbook entries with engine data " +
      "(i.e. vessel has no engine or SignalK is not reporting propulsion.%.runTime).\n\n" +
      "Use when asked: 'how many engine hours do I have?', " +
      "'is my engine service due?', " +
      "'how much did I motor this month?', " +
      "'when should I service my engine?', " +
      "'what are my engine hours?'.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
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
    name: "find_community_routes",
    title: "Find community passages between two places",
    description:
      "Search the PostgSail community for recorded passages between two geographic areas " +
      "using H3 spatial indexing. Returns per-trip stats from real passages: distance (NM), " +
      "duration (hours), avg speed (knots), max wind (knots), and tortuosity " +
      "(1.0=straight line, >1.5=heavy tacking or winding route).\n\n" +
      "You must supply H3 res-5 cell strings — resolve place names yourself:\n" +
      "• Named route: use your geographic knowledge → coordinates → " +
      "  h3.latlng_to_cell(lat, lng, 5). " +
      "  Example: Gothenburg (57.71, 11.97) → '851f97fffffffff'.\n" +
      "• User's own trip: call get_log_spatial first, read from_h3 and to_h3 directly.\n" +
      "• k controls neighbourhood size: 0=exact cell, 1=7-cell ring (~252km² buffer, default), " +
      "  2=19-cell ring. Larger k = broader match, fewer misses, more noise.",
    inputSchema: {
      type: "object",
      properties: {
        from_h3: {
          type: "string",
          description:
            "H3 res-5 cell index for the departure area. " +
            "Compute with h3.latlng_to_cell(lat, lng, 5) or read from get_log_spatial.from_h3.",
        },
        to_h3: {
          type: "string",
          description:
            "H3 res-5 cell index for the arrival area. " +
            "Compute with h3.latlng_to_cell(lat, lng, 5) or read from get_log_spatial.to_h3.",
        },
        k: {
          type: "number",
          description:
            "Ring size: 0=exact cell match, 1=7-cell ring (default), 2=19-cell ring. " +
            "Use 1 for most passages. Use 0 only when you have a precise H3 cell and want strict matching.",
          default: 1,
        },
      },
      required: ["from_h3", "to_h3"],
    },
  },

  {
    name: "find_similar_trips",
    title: "Find community trips similar to a description",
    description:
      "Semantic similarity search across public community logbooks using pgvector HNSW. " +
      "Finds trips whose route character and conditions are semantically similar to a text description.\n\n" +
      "Embed the query text using the same 384-dim model as the PostgSail pipeline " +
      "(e.g. all-MiniLM-L6-v2) and pass the float array as query_embedding.\n\n" +
      "Returns: from/to moorage names, date, distance, duration, and similarity score [0–1]. " +
      "Only trips from vessels that have opted into public data sharing are returned.\n\n" +
      "Use when asked: 'find trips like a coastal Med cruise in summer', " +
      "'who else has sailed an overnight passage in light winds through the archipelago?'",
    inputSchema: {
      type: "object",
      properties: {
        query_embedding: {
          type: "array",
          items: { type: "number" },
          description:
            "384-dimensional float vector produced by embedding the user's query text. " +
            "Must use the same model as the PostgSail embedding pipeline.",
        },
        limit: {
          type: "number",
          description: "Maximum number of similar trips to return (default: 5).",
          default: 5,
        },
      },
      required: ["query_embedding"],
    },
  },

  {
    name: "find_anchorages_near",
    title: "Find anchorages near a location",
    description:
      "Find anchorages, marinas, moorings, or docks near a position from the PostgSail " +
      "community (vessels that have opted into public data sharing).\n\n" +
      "Resolve place names to coordinates yourself before calling:\n" +
      "• 'near me' / 'nearby': call get_monitoring_live first for current lat/lon.\n" +
      "• Named place: use your geographic knowledge " +
      "  (e.g. Gothenburg ≈ 57.71°N 11.97°E; Ibiza ≈ 38.91°N 1.43°E).\n\n" +
      "stay_type: pass null or omit for all types. " +
      "Default radius is 20nm — increase for sparse areas.",
    inputSchema: {
      type: "object",
      properties: {
        lat: {
          type: "number",
          description: "Center latitude (WGS84 decimal degrees)",
        },
        lng: {
          type: "number",
          description: "Center longitude (WGS84 decimal degrees)",
        },
        radius_nm: {
          type: "number",
          description: "Search radius in nautical miles (default 20).",
          default: 20,
        },
        stay_type: {
          type: "string",
          enum: ["Anchor", "Dock", "Mooring Buoy"],
          description: "Filter by stay type. Omit or pass null for all types.",
        },
      },
      required: ["lat", "lng"],
    },
  },

  {
    name: "get_reachable_moorages",
    title: "Find moorages reachable within N hours",
    description:
      "Find community moorages reachable within N sailing hours from a given position, " +
      "using the vessel's polar curve to estimate VMG at the given wind speed. " +
      "Falls back to 6 knots if no polar is loaded or no wind data is provided.\n\n" +
      "The response includes estimated_sog_kn (speed used) and polar_used (bool) " +
      "so you can tell the user whether their polar was applied or a fallback was used.\n\n" +
      "wind_twd_deg is accepted but bearing filtering is not yet implemented (reserved). " +
      "Use when asked: 'where can I be tonight?', 'which anchorages can I reach before dark?'.",
    inputSchema: {
      type: "object",
      properties: {
        lat: {
          type: "number",
          description: "Current latitude (WGS84). Call get_monitoring_live first if unknown.",
        },
        lng: {
          type: "number",
          description: "Current longitude (WGS84). Call get_monitoring_live first if unknown.",
        },
        max_hours: {
          type: "number",
          description: "Maximum sailing time in hours (default 3).",
          default: 3,
        },
        wind_tws_kn: {
          type: "number",
          description: "True wind speed in knots. Used with polar to estimate VMG.",
        },
        wind_twd_deg: {
          type: "number",
          description: "True wind direction in degrees (reserved for future tacking filter).",
        },
        tacking_ok: {
          type: "boolean",
          description: "Reserved for future upwind bearing filter. Currently ignored.",
          default: true,
        },
        stay_type: {
          type: "string",
          enum: ["Anchor", "Dock", "Mooring Buoy"],
          description: "Filter by stay type. Omit for all types.",
        },
      },
      required: ["lat", "lng"],
    },
  },

  {
    name: "get_sail_recommendation",
    title: "Recommend sail configuration for current conditions",
    description:
      "Given wind conditions and the vessel's polar, recommend sail configuration " +
      "(headsail, main, reefing) and point of sail. Returns has_polar (bool) — " +
      "if false, advice is generic Beaufort-scale guidance only, not boat-specific. " +
      "Returns polar_vmg_kn when a polar match is found and target_bearing_deg is provided.\n\n" +
      "Use when asked: 'what sails should I set?', 'should I reef?', " +
      "'best angle to the wind for this passage?', 'will we be close-hauled?'.",
    inputSchema: {
      type: "object",
      properties: {
        tws_kn: {
          type: "number",
          description: "True wind speed in knots.",
        },
        twd_deg: {
          type: "number",
          description: "True wind direction in degrees (0–360, where wind is coming from).",
        },
        target_bearing_deg: {
          type: "number",
          description:
            "Desired course to make good (degrees). " +
            "Provide to get point-of-sail and polar VMG for that heading. " +
            "Omit for generic wind-strength advice only.",
        },
      },
      required: ["tws_kn", "twd_deg"],
    },
  },
];

export const tools: Tool[] = toolDefinitions.map((tool) => ({
  ...tool,
  annotations: { ...READ_ONLY_ANNOTATIONS, ...tool.annotations },
}));
