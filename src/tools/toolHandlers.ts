import PostgSailClient, { ViewResult } from "../client/postgsail-client.js";
import { resourcesMap } from "../resources/resourceHandlers.js";

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

      case "get_logs": {
        const result = await client.getLogs({
          start_date: (args?.start_date as string) || undefined,
          end_date: (args?.end_date as string) || undefined,
          distance: (args?.distance as number) || undefined,
          duration: (args?.duration as number) || undefined,
          tags: (args?.tags as string[]) || undefined,
          limit: (args?.limit as number) || 10,
          offset: (args?.offset as number) || 0,
        });
        const logs = unwrapArray(result, "logbooks");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(logs, null, 2) + paginationNote(result),
            },
          ],
        };
      }

      case "get_last_log": {
        const result = await client.getLastLog();
        const lastLog = unwrapArray(result, "last log");
        return {
          content: [{ type: "text", text: JSON.stringify(lastLog, null, 2) }],
        };
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
        const result = await client.getLog(args.id as string);
        const logData = unwrapArray(result, "logbook");
        return {
          content: [{ type: "text", text: JSON.stringify(logData, null, 2) }],
        };
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
        if (!profile?.settings) throw new Error("No profile data found");
        return {
          content: [{ type: "text", text: JSON.stringify(profile.settings, null, 2) }],
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

      case "get_timelapse_data": {
        if (!args?.startDate || !args?.endDate) {
          throw new Error("startDate and endDate are required");
        }
        let timelapse;
        if (args?.format === "linestring") {
          timelapse = await client.getTimelapse({
            start_date: args.startDate,
            end_date: args.endDate,
          });
        } else {
          timelapse = await client.getTimelapseTrips(
            `start_date=${args.startDate}&end_date=${args.endDate}`
          );
        }
        const timelapseData = unwrapData(timelapse, "timelapse");
        return {
          content: [{ type: "text", text: JSON.stringify(timelapseData, null, 2) }],
        };
      }

      case "get_initial_context": {
        const contextData: Record<string, any> = {
          server_info: {
            name: "postgsail-server",
            version: "0.0.7",
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
