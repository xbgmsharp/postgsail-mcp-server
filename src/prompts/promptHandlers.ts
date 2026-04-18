export async function handlePromptCall(request: any) {
  const { name, arguments: args } = request.params;
  console.log("GetPromptRequest:", name, args);

  try {
    switch (name) {
      case "vessel-system-status":
        return {
          description:
            "Give me a summary of {{vessel_name}}'s current systems status.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Provide a daily briefing of my boat's systems",
              },
            },
          ],
        };

      case "stays-analysis":
        return {
          description:
            "📍 Analyze stays by duration, showing which anchorages, docks, or mooring buoys the vessel used longest, with total time spent at each location.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "📍 Analyze stays by duration, showing which anchorages, docks, or mooring buoys the vessel used longest, with total time spent at each location.",
              },
            },
          ],
        };

      case "moorages-analysis":
        return {
          description:
            "⚓ List all moorages (anchorages, docks, mooring buoys) visited, including arrival/departure times, duration, and location details from the stays table.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "⚓ List all moorages (anchorages, docks, mooring buoys) visited, including arrival/departure times, duration, and location details from the stays table.",
              },
            },
          ],
        };

      case "last-logbook-summary":
        return {
          description: "Summarize my last voyage log.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Summarize my last voyage log.",
              },
            },
          ],
        };

      case "logbook-summary":
        return {
          description: "Summarize the voyage logs for the last month.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Summarize the voyage logs for the last month.",
              },
            },
          ],
        };

      case "system-monitoring":
        return {
          description: "🔧 List any alerts or events from the vessel today.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "List any alerts or events from the vessel today.",
              },
            },
          ],
        };

      case "stats-summary":
        return {
          description: "Summarize my stats.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "for which period? last month? this year? this summer?",
              },
            },
          ],
        };

      case "anchor-watch":
        return {
          description: "Check anchor watch status and position drift.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Check the current anchor watch status: report the depth, anchor radius, current position, and any recent position drift or alerts from live monitoring.",
              },
            },
          ],
        };

      case "battery-health":
        return {
          description: "Analyze battery charge and solar trends.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Analyze battery health over the last 48 hours: show charge level trend, voltage, solar panel input, and flag any low-battery events or anomalies.",
              },
            },
          ],
        };

      case "voyage-planning":
        return {
          description: "Plan the next voyage using historical data.",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "Help me plan my next voyage: review my most visited moorages, typical trip distances and durations, sailing performance metrics, and suggest potential destinations based on past routes.",
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
}
