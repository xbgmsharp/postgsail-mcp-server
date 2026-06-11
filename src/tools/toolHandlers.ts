import PostgSailClient, { ViewResult } from "../client/postgsail-client.js";
import { resourcesMap } from "../resources/resourceHandlers.js";

/** Strip Point/MultiPoint features from a log's geojson FeatureCollection — keep only LineString. */
function dropPointFeatures(log: any): any {
  if (!Array.isArray(log?.geojson?.features)) return log;
  const features = log.geojson.features.filter(
    (f: any) => f?.geometry?.type !== "Point" && f?.geometry?.type !== "MultiPoint"
  );
  return { ...log, geojson: { ...log.geojson, features } };
}

/** Inject log_url and timelapse_url into each log entry when public_vessel is available. */
function withLogLinks(logs: any[], publicVessel: string | undefined): any[] {
  if (!publicVessel) return logs;
  const base = process.env.POSTGSAIL_WEB_URL || "https://iot.openplotter.cloud";
  return logs.map((log: any) => ({
    ...log,
    log_url: `${base}/${publicVessel}/log/${log.id}`,
    timelapse_url: `${base}/${publicVessel}/timelapse/${log.id}`,
  }));
}

/** Unwrap a ViewResult to its data array/object, throwing if shape is unexpected. */
function unwrapArray(result: ViewResult | string, label: string): any[] {
  if (typeof result === "string") throw new Error(`Unexpected text response for ${label}`);
  if (!Array.isArray(result.data)) throw new Error(`Invalid ${label} data`);
  return result.data;
}

function unwrapData(result: ViewResult | string, label: string): any {
  if (typeof result === "string") throw new Error(`Unexpected text response for ${label}`);
  return result.data;
}

const GIS_BASE_URL = "https://gis.openplotter.cloud";

async function fetchLogMapImage(vesselId: string, logId: string): Promise<{ type: "image"; data: string; mimeType: string } | null> {
  try {
    const url = `${GIS_BASE_URL}/log_${vesselId}_${logId}.png`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return {
      type: "image",
      data: Buffer.from(buffer).toString("base64"),
      mimeType: "image/png",
    };
  } catch {
    return null;
  }
}

/** Format pagination info for inclusion in tool responses. */
function paginationNote(result: ViewResult | string): string {
  if (typeof result === "string" || result.totalCount === null) return "";
  const returned = Array.isArray(result.data) ? result.data.length : 1;
  const total = result.totalCount;
  if (total > returned) {
    return `\n\n[Showing ${returned} of ${total} total results. Use offset parameter to paginate.]`;
  }
  return `\n\n[Total: ${total} results]`;
}

export async function handleToolCall(params: any, client: PostgSailClient) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case "get_vessels": {
        const result = await client.getVessels();
        const vessels = unwrapArray(result, "vessels");
        return {
          content: [{ type: "text", text: JSON.stringify(vessels, null, 2) }],
        };
      }

      case "get_vessel": {
        const vessel = await client.getVessel();
        if (!vessel?.vessel) throw new Error("No vessel data found");
        return {
          content: [{ type: "text", text: JSON.stringify(vessel.vessel, null, 2) }],
        };
      }

      case "get_vessel_activity": {
        const vesselActivity = await client.getVesselActivity();
        if (!vesselActivity) throw new Error("No vessel activity data found");
        return {
          content: [{ type: "text", text: JSON.stringify(vesselActivity, null, 2) }],
        };
      }

      case "get_logs": {
        const [result, publicVessel] = await Promise.all([
          client.getLogs({
            start_date: (args?.start_date as string) || undefined,
            end_date: (args?.end_date as string) || undefined,
            distance: (args?.distance as number) || undefined,
            duration: (args?.duration as number) || undefined,
            tags: (args?.tags as string[]) || undefined,
            limit: (args?.limit as number) || 10,
            offset: (args?.offset as number) || 0,
          }),
          client.getPublicVessel(),
        ]);
        const logs = withLogLinks(unwrapArray(result, "logbooks"), publicVessel ?? undefined);
        return {
          content: [{ type: "text", text: JSON.stringify(logs, null, 2) + paginationNote(result) }],
        };
      }

      case "get_last_log": {
        const [result, publicVessel] = await Promise.all([
          client.getLastLog(),
          client.getPublicVessel(),
        ]);
        const lastLog = withLogLinks(unwrapArray(result, "last log"), publicVessel ?? undefined).map(dropPointFeatures);
        const content: any[] = [{ type: "text", text: JSON.stringify(lastLog, null, 2) }];
        const log0 = lastLog[0];
        if (log0?.vessel_id && log0?.id) {
          const img = await fetchLogMapImage(log0.vessel_id, log0.id);
          if (img) content.push(img);
        }
        return { content };
      }

      case "get_logs_geojson": {
        const result = await client.getLogsMap(args?.page as number || 1);
        const logsGeoJSON = unwrapArray(result, "logs geojson");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(logsGeoJSON, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_log": {
        if (!args?.id) throw new Error("Log ID is required");
        const [result, publicVessel] = await Promise.all([
          client.getLog(args.id as string),
          client.getPublicVessel(),
        ]);
        const logData = withLogLinks(unwrapArray(result, "logbook"), publicVessel ?? undefined).map(dropPointFeatures);
        const content: any[] = [{ type: "text", text: JSON.stringify(logData, null, 2) }];
        const log = logData[0];
        if (log?.vessel_id && log?.id) {
          const img = await fetchLogMapImage(log.vessel_id, log.id);
          if (img) content.push(img);
        }
        return { content };
      }

      case "get_moorages": {
        const result = await client.getMoorages({
          default_stay_type: (args?.default_stay_type as string) || "All",
          limit: (args?.limit as number) || 10,
          offset: (args?.offset as number) || 0,
        });
        const moorages = unwrapArray(result, "moorages");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(moorages, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_moorage": {
        if (!args?.id) throw new Error("Moorage ID is required");
        const result = await client.getMoorage(args.id as string);
        const moorageData = unwrapArray(result, "moorage");
        return {
          content: [{ type: "text", text: JSON.stringify(moorageData, null, 2) }],
        };
      }

      case "get_moorages_geojson": {
        const result = await client.getMooragesMap(args?.page as number || 1);
        const mooragesGeoJSON = unwrapArray(result, "moorages geojson");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mooragesGeoJSON, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_moorage_stays": {
        if (!args?.id) throw new Error("Moorage ID is required");
        const result = await client.getMoorageStays(args.id as string);
        const moorageStaysData = unwrapArray(result, "moorage stays");
        return {
          content: [{ type: "text", text: JSON.stringify(moorageStaysData, null, 2) }],
        };
      }

      case "get_moorage_arrivals_departures": {
        if (!args?.id) throw new Error("Moorage ID is required");
        const result = await client.getMoorageArrivalsDepartures(args.id as string);
        const logsData = unwrapArray(result, "moorage arrivals/departures");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(logsData, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_stays": {
        const result = await client.getStays({
          arrived: (args?.arrived as string) || undefined,
          departed: (args?.departed as string) || undefined,
          stay_type: (args?.stay_type as string) || "All",
          duration: (args?.duration as number) || undefined,
          limit: (args?.limit as number) || 10,
          offset: (args?.offset as number) || 0,
        });
        const stays = unwrapArray(result, "stays");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stays, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_stay": {
        if (!args?.id) throw new Error("Stay ID is required");
        const result = await client.getStay(args.id as string);
        const stayData = unwrapArray(result, "stay");
        return {
          content: [{ type: "text", text: JSON.stringify(stayData, null, 2) }],
        };
      }

      case "get_stays_geojson": {
        const result = await client.getStaysMap(args?.page as number || 1);
        const staysGeoJSON = unwrapArray(result, "stays geojson");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(staysGeoJSON, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_monitoring_live": {
        const result = await client.getMonitoringLive();
        const liveData = unwrapArray(result, "live monitoring");
        if (!liveData[0]) throw new Error("No live monitoring data available");
        return {
          content: [{ type: "text", text: JSON.stringify(liveData[0], null, 2) }],
        };
      }

      case "get_monitoring_history": {
        const intervalMap: Record<string, number> = {
          "24 hours": 24,
          "48 hours": 48,
          "72 hours": 72,
          "7 days": 168,
        };
        const hours = intervalMap[args?.time_interval as string] ?? 24;
        const result = await client.getMonitoringHistory({ time_interval: hours });
        const monitoringData = unwrapData(result, "monitoring history");
        return {
          content: [{ type: "text", text: JSON.stringify(monitoringData, null, 2) }],
        };
      }

      case "export_log_track": {
        if (!args?.logId) throw new Error("Log ID is required");
        let exportResult: ViewResult | string;
        if (args?.format === "gpx") {
          exportResult = await client.exportLogGPX(args.logId as string);
        } else if (args?.format === "kml") {
          exportResult = await client.exportLogKML(args.logId as string);
        } else {
          exportResult = await client.exportLogGeoJSON(args.logId as string);
        }
        const text =
          typeof exportResult === "string"
            ? exportResult
            : JSON.stringify(exportResult.data, null, 2);
        return {
          content: [{ type: "text", text }],
        };
      }

      case "get_stats": {
        const result = await client.getStats({
          start_date: args?.start_date || null,
          end_date: args?.end_date || null,
        });
        const statsData = unwrapData(result, "stats");
        return {
          content: [{ type: "text", text: JSON.stringify(statsData, null, 2) }],
        };
      }

      case "get_logs_by_month": {
        const result = await client.getLogsByMonth();
        const logsByMonth = unwrapData(result, "logs by month");
        return {
          content: [{ type: "text", text: JSON.stringify(logsByMonth, null, 2) }],
        };
      }

      case "get_logs_by_week": {
        const result = await client.getLogsByWeek();
        const logsByWeek = unwrapData(result, "logs by week");
        return {
          content: [{ type: "text", text: JSON.stringify(logsByWeek, null, 2) }],
        };
      }

      case "get_logs_by_day": {
        const result = await client.getLogsByDay();
        const logsByDay = unwrapData(result, "logs by day");
        return {
          content: [{ type: "text", text: JSON.stringify(logsByDay, null, 2) }],
        };
      }

      case "get_event_logs": {
        const result = await client.getEventLogs();
        const eventLogs = unwrapData(result, "event logs");
        return {
          content: [{ type: "text", text: JSON.stringify(eventLogs, null, 2) }],
        };
      }

      case "get_badges": {
        const result = await client.getBadges();
        const badges = unwrapData(result, "badges");
        return {
          content: [{ type: "text", text: JSON.stringify(badges, null, 2) }],
        };
      }

      case "get_profile": {
        const profile = await client.getProfile();
        if (!profile.profile) throw new Error("No profile data found");
        return {
          content: [{ type: "text", text: JSON.stringify(profile.profile, null, 2) }],
        };
      }

      case "get_vessel_mapping": {
        const result = await client.getVesselMapping();
        const mapping = unwrapArray(result, "vessel mapping");
        if (!mapping[0]?.configuration) throw new Error("No vessel mapping data found");
        return {
          content: [{ type: "text", text: JSON.stringify(mapping[0], null, 2) }],
        };
      }

      case "get_vessel_polar": {
        const result = await client.getVesselPolar();
        const mapping = unwrapArray(result, "vessel polar");
        if (!mapping[0]?.polar) throw new Error("No vessel polar data found");
        return {
          content: [{ type: "text", text: JSON.stringify(mapping[0], null, 2) }],
        };
      }

      case "get_timelapse_data": {
        const hasLogRange = args?.start_log !== undefined && args?.end_log !== undefined;
        const hasDateRange = args?.start_date && args?.end_date;
        if (!hasLogRange && !hasDateRange) {
          throw new Error("Provide either start_log+end_log (log IDs) or start_date+end_date");
        }
        const publicVessel = await client.getPublicVessel();
        if (!publicVessel) throw new Error("Could not determine public vessel name from profile");
        const webBaseURL = process.env.POSTGSAIL_WEB_URL || "https://iot.openplotter.cloud";
        const searchParams = new URLSearchParams();
        if (hasLogRange) {
          searchParams.set("start_log", String(args.start_log));
          searchParams.set("end_log", String(args.end_log));
        }
        if (hasDateRange) {
          searchParams.set("start_date", args.start_date as string);
          searchParams.set("end_date", args.end_date as string);
        }
        if (args?.map_type)  searchParams.set("map_type",  args.map_type  as string);
        if (args?.zoom !== undefined) searchParams.set("zoom", String(args.zoom));
        if (args?.color)     searchParams.set("color",     args.color     as string);
        if (args?.boat_type) searchParams.set("boat_type", args.boat_type as string);
        const url = `${webBaseURL}/${publicVessel}/timelapse?${searchParams.toString()}`;
        return {
          content: [{ type: "text", text: url }],
        };
      }

      case "get_user_context": {
        const contextData = await client.getContext();
        if (!contextData.context) throw new Error("No sailor data found");
        return {
          content: [{ type: "text", text: JSON.stringify(contextData.context, null, 2) }],
        };
      }

      case "get_initial_context": {
        const contextData: Record<string, any> = {
          server_info: {
            name: "postgsail-server",
            version: "0.0.9",
            loaded_at: new Date().toISOString(),
            description:
              "PostgSail MCP Server - Provides AI agents with read only access to marine vessel data",
          },
        };
        for (const [uri, content] of resourcesMap.entries()) {
          const resourceKey = uri.replace("postgsail://", "");
          contextData[resourceKey] = content;
        }
        return {
          content: [{ type: "text", text: JSON.stringify(contextData, null, 2) }],
        };
      }

      // =========================================================================
      // VESSEL TOOLS
      // =========================================================================
      case "get_sail_recommendation": {
        if (args?.tws_kn === undefined || args?.twd_deg === undefined) {
          throw new Error("tws_kn and twd_deg are required");
        }
        const result = await client.getSailRecommendation({
          tws_kn: args.tws_kn as number,
          twd_deg: args.twd_deg as number,
          target_bearing_deg: args.target_bearing_deg as number | undefined,
        });
        const recommendation = unwrapData(result, "sail recommendation");
        return {
          content: [{ type: "text", text: JSON.stringify(recommendation, null, 2) }],
        };
      }

      case "get_engine_hours": {
        const result = await client.getEngineHours();
        const data = unwrapData(result, "engine hours");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      // =========================================================================
      // COMMUNITY DATA — sailors who opted into public sharing
      // =========================================================================
      // find_community_routes → mcp_community_routes_fn
      case "find_community_routes": {
        if (
          args?.from_lat === undefined || args?.from_lng === undefined ||
          args?.to_lat   === undefined || args?.to_lng   === undefined
        ) {
          throw new Error("from_lat, from_lng, to_lat and to_lng are required");
        }
        const result = await client.findCommunityRoutes({
          from_lat:  args.from_lat  as number,
          from_lng:  args.from_lng  as number,
          to_lat:    args.to_lat    as number,
          to_lng:    args.to_lng    as number,
          radius_nm: (args.radius_nm as number) ?? 30,
          limit:     (args.limit     as number) ?? 10,
        });
        const routesData = unwrapData(result, "community routes");
        return { content: [{ type: "text", text: JSON.stringify(routesData, null, 2) }] };
      }

      // find_anchorages_near → mcp_community_moorages_fn
      case "find_anchorages_near": {
        if (args?.latitude === undefined || args?.longitude === undefined) {
          throw new Error("latitude and longitude are required");
        }
        const stayType =
          args.stay_type && args.stay_type !== "All"
            ? (args.stay_type as string)
            : undefined;
        const result = await client.findAnchoragesNear({
          lat:       args.latitude  as number,
          lng:       args.longitude as number,
          radius_nm: (args.radius_nm as number) ?? 20,
          stay_type: stayType,
        });
        const anchorages = unwrapData(result, "anchorages near");
        return {
          content: [{
            type: "text",
            text: JSON.stringify(anchorages, null, 2) + paginationNote(result),
          }],
        };
      }

      // find_reachable_moorages → mcp_community_moorages_reachable_fn
      case "find_reachable_moorages": {
        if (args?.lat === undefined || args?.lng === undefined) {
          throw new Error("lat and lng are required");
        }
        const stayType =
          args.stay_type && args.stay_type !== "All"
            ? (args.stay_type as string)
            : undefined;
        const result = await client.getReachableMoorages({
          lat:          args.lat          as number,
          lng:          args.lng          as number,
          max_hours:    (args.max_hours    as number)  ?? 3,
          wind_tws_kn:  args.wind_tws_kn  as number | undefined,
          wind_twd_deg: args.wind_twd_deg as number | undefined,
          tacking_ok:   (args.tacking_ok  as boolean) ?? true,
          stay_type:    stayType,
          radius_nm:    args.radius_nm    as number | undefined,
        });
        const moorages = unwrapData(result, "reachable moorages");
        return { content: [{ type: "text", text: JSON.stringify(moorages, null, 2) }] };
      }

      // get_area_stats → mcp_community_area_stats_fn
      case "get_area_stats": {
        if (args?.lat === undefined || args?.lng === undefined) {
          throw new Error("lat and lng are required");
        }
        const result = await client.getAreaStats({
          lat:       args.lat       as number,
          lng:       args.lng       as number,
          radius_nm: (args.radius_nm as number)   ?? 50,
          months:    args.months    as number[] | undefined,
        });
        const statsData = unwrapData(result, "area stats");
        return { content: [{ type: "text", text: JSON.stringify(statsData, null, 2) }] };
      }
 
      // get_hotspots → mcp_community_hotspots_fn
      case "get_hotspots": {
        if (!args?.waypoint_h3) throw new Error("waypoint_h3 is required");
        const result = await client.getHotspots({
          waypoint_h3: args.waypoint_h3 as string,
          k:           (args.ring_size  as number) ?? 1,
        });
        const hotspotsData = unwrapData(result, "hotspots");
        return { content: [{ type: "text", text: JSON.stringify(hotspotsData, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
