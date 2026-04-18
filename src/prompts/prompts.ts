
export const PROMPTS = {
  "vessel-system-status": {
    name: "vessel-system-status",
    description:
      "🛥️ Get current vessel systems status including battery charge, voltage, environmental sensors (temperature, humidity, pressure), depth, wind conditions, and online/offline status from the monitoring view.",
    arguments: [],
  },
  "stays-analysis": {
    name: "stays-analysis",
    description:
      "📍 Analyze stays by duration, showing which anchorages, docks, or mooring buoys the vessel used longest, with total time spent at each location.",
    arguments: [],
  },
  "moorages-analysis": {
    name: "moorages-analysis",
    description:
      "⚓ List all moorages (anchorages, docks, mooring buoys) visited, including arrival/departure times, duration, and location details from the stays table.",
    arguments: [],
  },
  "last-logbook-summary": {
    name: "last-logbook-summary",
    description:
      "🧾 Summarize the most recent completed voyage including distance traveled, duration, max speed, wind conditions, and trajectory data from the logbook table.",
    arguments: [],
  },
  "logbook-summary": {
    name: "logbook-summary",
    description:
      "🧾 Aggregate voyage statistics for the last month including total distance, time underway, number of trips, and sailing performance metrics from completed logbook entries.",
    arguments: [],
  },
  "system-monitoring": {
    name: "system-monitoring",
    description:
      "🔧 Check for system alerts, low battery warnings, connectivity issues, and recent sensor anomalies based on metrics data and alerting thresholds configured for the vessel.",
    arguments: [],
  },
  "stats-summary": {
    name: "stats-summary",
    description:
      "📊 Summarize vessel statistics for a chosen period (last month, this year, this summer), including aggregate distance, time underway, and moorage data.",
    arguments: [],
  },
  "anchor-watch": {
    name: "anchor-watch",
    description:
      "⚓ Check anchor watch status: current depth, vessel position, anchor radius, and any recent position drift warnings. Useful when the vessel is at anchor.",
    arguments: [],
  },
  "battery-health": {
    name: "battery-health",
    description:
      "🔋 Analyze battery health trends over the last 24–48 hours: charge level, voltage, solar input, and any low-battery events. Useful for energy management.",
    arguments: [],
  },
  "voyage-planning": {
    name: "voyage-planning",
    description:
      "🗺️ Help plan the next voyage by reviewing past routes, frequently visited moorages, typical distances, and sailing performance from historical logbook data.",
    arguments: [],
  },
};