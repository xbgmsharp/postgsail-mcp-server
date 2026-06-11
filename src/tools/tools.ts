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
      "Returns the complete vessel profile:\n" +
      "• Identity: name, MMSI, vessel_id, registration country, AIS ship type\n" +
      "• Physical dimensions from AIS/SignalK: length (m), beam (m), height (m)\n" +
      "• Connectivity: first_contact, last_contact, offline flag (no data >70 min)\n" +
      "• Make/model: user-entered string (e.g. 'Bavaria 38 Holiday', 'Sun Fast 37')\n" +
      "• Boat spec (spec key): structured sailboatdata.com data when linked — " +
      "  LOA, LWL, beam, max/min draft (m), displacement (kg), ballast (kg), " +
      "  sail area (m²), SA/displacement ratio, ballast/displacement ratio, " +
      "  displacement/length ratio, comfort ratio, capsize screening formula, " +
      "  hull speed (kn), rig type, keel type, hull type, designer, builder, build years.\n" +
      "• has_polar: true if a polar diagram CSV is loaded\n" +
      "• Images: primary vessel photo URL if available\n\n" +
      "Use when asked: 'what boat do I have?', 'what are my vessel specs?', " +
      "'is my boat suitable for offshore sailing?', 'what is my comfort ratio?', " +
      "'how long is my boat?', 'what is my displacement?'",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_vessel_polar",
    title: "Get vessel Polar metadata",
    description:
      "Returns the vessel's Polar (CSV) data if present in an OCR CSV format. Useful for performance analysis and optimization.",
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
    title: "Get vessel timelapse web player URL",
    description:
      "Returns a URL to the PostgSail timelapse web player showing the vessel's movement animated on a map. " +
      "The player supports replay controls, speed adjustment, instruments overlay, satellite map, and 3D mode. " +
      "Use when the user wants to visualize, animate, or replay one or multiple trips. " +
      "Identify the trip range using get_logs or get_last_log. " +
      "Provide log IDs (start_log / end_log) for a precise range, or dates (start_date / end_date) to span a period. " +
      "Use the same value for start_log and end_log to replay a single trip.",
    inputSchema: {
      type: "object",
      properties: {
        start_log: {
          type: "number",
          description: "ID of the first log to include. Preferred over start_date when available.",
        },
        end_log: {
          type: "number",
          description: "ID of the last log to include. Use same as start_log for a single trip.",
        },
        start_date: {
          type: "string",
          description: "Start of period (ISO 8601). Alternative to start_log.",
        },
        end_date: {
          type: "string",
          description: "End of period (ISO 8601). Alternative to end_log.",
        },
        map_type: {
          type: "string",
          enum: ["Satellite", "OpenStreetMap", "CartoDB.Positron", "CartoDB.DarkMatter", "Eniro (Scandinavia)", "Nautical charts (USA)", "EMODnet Bathymetry"],
          description: "Base map style. Default: Satellite.",
          default: "Satellite",
        },
        zoom: {
          type: "number",
          enum: [5, 6, 7, 8, 9, 10, 11, 12, 13],
          description: "Initial map zoom level (5–13). Default: 13.",
          default: 13,
        },
        color: {
          type: "string",
          enum: ["dodgerblue", "green", "yellow", "red", "orange", "black", "gray", "white"],
          description: "Track color. Default: dodgerblue.",
          default: "dodgerblue",
        },
        boat_type: {
          type: "string",
          enum: ["Sailboat", "SailboatSails", "Powerboat", "Dot"],
          description: "Boat icon style. Default: SailboatSails.",
          default: "SailboatSails",
        },
      },
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
  // =========================================================================
  // VESSEL TOOLS
  // =========================================================================
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
  // =========================================================================
  // COMMUNITY DATA — sailors who opted into public sharing
  // =========================================================================
  {
    name: "find_community_routes",
    title: "Find community passages between two places",
    description:
      "Community passages between two geographic areas from sailors who opted into public sharing. " +
      "Returns real passage stats: distance (NM), duration (hours), avg speed (knots), " +
      "max wind (knots), vessel type.\n\n" +
      "GEOCODING — resolve place names to coordinates before calling:\n" +
      "• Use island or harbour CENTRE coordinates — radius_nm covers all departure points.\n" +
      "• A single island spans multiple H3 cells; always use a large enough radius.\n\n" +
      "RADIUS GUIDANCE:\n" +
      "• 30nm: island-to-island Med or Baltic (Menorca, Mallorca, Gotland from centre)\n" +
      "• 15nm: port-to-port or coastal\n" +
      "• 50nm+: ocean passage endpoints\n\n" +
      "NOTE: matches trips by start AND end. For transit queries use get_hotspots.\n\n" +
      "FALLBACK: if empty, do NOT stop. Call find_anchorages_near for the destination, " +
      "get_vessel for boat specs, and use your nautical knowledge to plan the passage.\n\n" +
      "Use when asked: 'has anyone sailed from X to Y?', " +
      "'how long does this passage take?', 'what wind on this route?'",
    inputSchema: {
      type: "object",
      properties: {
        from_lat:  { type: "number", description: "Departure area center latitude" },
        from_lng:  { type: "number", description: "Departure area center longitude" },
        to_lat:    { type: "number", description: "Arrival area center latitude" },
        to_lng:    { type: "number", description: "Arrival area center longitude" },
        radius_nm: { type: "number", default: 30, description: "Search radius in NM (default 30)" },
        limit:     { type: "number", default: 10, description: "Max results (default 10)" },
      },
      required: ["from_lat", "from_lng", "to_lat", "to_lng"],
    },
  },

  {
    name: "find_anchorages_near",
    title: "Find community anchorages near a location",
    description:
      "Find anchorages, marinas, moorings, or docks near a position from the PostgSail community " +
      "(sailors who opted into public data sharing). " +
      "Returns name, stay type, distance, OSM data (wikidata, wikipedia, note, osm_url).\n\n" +
      "GEOCODING — resolve place names to coordinates before calling:\n" +
      "• 'near me' / 'nearby': call get_monitoring_live first for current lat/lon.\n" +
      "• Named place: use geographic knowledge " +
      "(Gothenburg ≈ 57.71°N 11.97°E; Ibiza ≈ 38.91°N 1.43°E).\n" +
      "• Coordinates provided: use as-is.\n\n" +
      "Use when asked: 'find an anchorage near X', 'where can I anchor near Y', " +
      "'anchorages I haven't visited', 'shelter near [place]', 'find a dock within 20nm'.",
    inputSchema: {
      type: "object",
      properties: {
        latitude:       { type: "number", description: "Center latitude (WGS84)" },
        longitude:      { type: "number", description: "Center longitude (WGS84)" },
        radius_nm:      { type: "number", default: 20,  description: "Search radius in nautical miles (default 20)" },
        stay_type:      { type: "string", enum: ["All", "Anchor", "Dock", "Mooring Buoy"], default: "All" },
        unvisited_only: {
          type: "boolean",
          default: false,
          description: "If true, only return moorages this vessel has never visited.",
        },
      },
      required: ["latitude", "longitude"],
    },
  },

  {
    name: "find_reachable_moorages",
    title: "Find moorages reachable within N hours",
    description:
      "Find community moorages reachable from a position within a given number of sailing hours. " +
      "Uses the vessel's polar diagram (if loaded) and current wind to estimate boat speed; " +
      "falls back to 6 knots if no polar or wind data is available.\n\n" +
      "Returns each moorage with distance_nm and eta_hours, plus OSM data " +
      "(wikidata, wikipedia, note, osm_url).\n\n" +
      "INPUTS:\n" +
      "• lat/lng: current position — read from get_monitoring_live if not provided\n" +
      "• max_hours: sailing time budget (default 3h)\n" +
      "• wind_tws_kn / wind_twd_deg: from get_monitoring_live for polar-based speed estimate\n\n" +
      "Use when asked: 'where can I reach in 3 hours?', 'what anchorages can I make before dark?', " +
      "'destinations within 4 hours sailing from here'.",
    inputSchema: {
      type: "object",
      properties: {
        lat:           { type: "number", description: "Current latitude. Read from get_monitoring_live." },
        lng:           { type: "number", description: "Current longitude. Read from get_monitoring_live." },
        max_hours:     { type: "number", default: 3,    description: "Maximum sailing time in hours (default 3)" },
        wind_tws_kn:   { type: "number", description: "True wind speed in knots for polar speed estimate." },
        wind_twd_deg:  { type: "number", description: "True wind direction in degrees." },
        stay_type:     { type: "string", enum: ["All", "Anchor", "Dock", "Mooring Buoy"], default: "All" },
        radius_nm:     { type: "number", description: "Override search radius in NM (default: max_hours × speed × 0.85)" },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "get_area_stats",
    title: "Get sailing conditions statistics for an area",
    description:
      "Aggregated wind and speed statistics from community trips through a geographic area. " +
      "Useful for passage planning: typical wind, worst-case (p90) wind, average speed.\n\n" +
      "Returns:\n" +
      "• avg_wind_kn: average max wind recorded on trips through this area\n" +
      "• p90_wind_kn: 90th percentile wind — worst-case planning figure\n" +
      "• avg_speed_kn: average boat speed\n" +
      "• avg_distance_nm: average trip distance through the area\n" +
      "• vessels_sampled: number of distinct vessels backing the data\n" +
      "• trip_count: total trips in sample\n\n" +
      "GEOCODING: resolve place name to coordinates before calling.\n" +
      "months: optional array of month numbers for seasonal filtering, e.g. [6,7,8] for summer.\n\n" +
      "Use when asked: 'what wind is typical between Gibraltar and Lisbon?', " +
      "'what are summer conditions in the Skagerrak?', " +
      "'what should I expect sailing the Bay of Biscay in July?'",
    inputSchema: {
      type: "object",
      properties: {
        lat:       { type: "number", description: "Area center latitude" },
        lng:       { type: "number", description: "Area center longitude" },
        radius_nm: { type: "number", default: 50,  description: "Area radius in nautical miles (default 50)" },
        months: {
          type: "array",
          items: { type: "number" },
          description: "Optional month filter, e.g. [6,7,8] for June–August. Omit for all-year.",
        },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "get_hotspots",
    title: "Find community trips through a waypoint or strait",
    description:
      "Find community trips that passed THROUGH a geographic area — a strait, canal, cape, or waypoint — " +
      "regardless of where the trip started or ended.\n\n" +
      "Different from find_community_routes (start+end match). Use get_hotspots for transit questions.\n\n" +
      "HOW TO CALL — supply an H3 cell string at resolution 5:\n" +
      "Compute with h3.latlng_to_cell(lat, lng, 5), or use a pre-computed cell below.\n\n" +
      "PRE-COMPUTED CELLS for common sailing waypoints:\n" +
      "• Gibraltar strait:    85391aa3fffffff  (36.14°N, 5.35°W)  — ring_size 2\n" +
      "• Dover strait:        8519480bfffffff  (51.02°N, 1.48°E)  — ring_size 1\n" +
      "• Skagerrak centre:    851f2483fffffff  (57.80°N, 9.50°E)  — ring_size 2\n" +
      "• Kattegat centre:     851f2393fffffff  (56.50°N, 11.50°E) — ring_size 1\n" +
      "• Bosphorus:           851ec917fffffff  (41.12°N, 29.08°E) — ring_size 1\n" +
      "• Strait of Messina:   853f26cffffffff  (38.25°N, 15.62°E) — ring_size 1\n" +
      "• Bonifacio strait:    851e9497fffffff  (41.37°N, 9.27°E)  — ring_size 1\n" +
      "• Cape Finisterre:     85392473fffffff  (42.88°N, 9.27°W)  — ring_size 1\n" +
      "• Cape St Vincent:     8539101bfffffff  (37.02°N, 9.00°W)  — ring_size 1\n" +
      "• Kiel Canal west:     851f1593fffffff  (53.89°N, 9.14°E)  — ring_size 1\n" +
      "• Kiel Canal east:     851f0603fffffff  (54.36°N, 10.15°E) — ring_size 1\n" +
      "• English Channel mid: 85186687fffffff  (50.00°N, 1.50°W)  — ring_size 1\n" +
      "• Bay of Biscay:       85185d43fffffff  (45.00°N, 5.00°W)  — ring_size 2\n\n" +
      "ring_size 1: narrow straits (Messina, Bonifacio, Kiel). " +
      "ring_size 2: wide straits, capes, open water (Gibraltar, Skagerrak, Biscay).\n\n" +
      "Use when asked: 'find trips through Gibraltar', 'who crossed the Skagerrak', " +
      "'passages through the Kiel Canal', 'who transited the Bosphorus', " +
      "'trips that rounded Cape Finisterre'.",
    inputSchema: {
      type: "object",
      properties: {
        waypoint_h3: {
          type: "string",
          description:
            "H3 cell index at resolution 5. Use pre-computed values above or " +
            "compute with h3.latlng_to_cell(lat, lng, 5).",
        },
        ring_size: {
          type: "number",
          default: 1,
          description: "Ring expansion: 1=7 cells (narrow strait), 2=19 cells (wide strait/cape).",
        },
      },
      required: ["waypoint_h3"],
    },
  },
];

export const tools: Tool[] = toolDefinitions.map((tool) => ({
  ...tool,
  annotations: { ...READ_ONLY_ANNOTATIONS, ...tool.annotations },
}));
