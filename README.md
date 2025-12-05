<br/>
<p align="center">
  <a href="https://github.com/xbgmsharp/postgsail">
    <img src="https://iot.openplotter.cloud/android-chrome-192x192.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">PostgSail</h3>

  <p align="center">
    PostgSail is an open-source alternative to traditional vessel data management!
    <br/>
    <br/>
    <a href="https://xbgmsharp.github.io/postgsail/">Website</a>
    .
    <a href="https://github.com/sponsors/xbgmsharp">Sponsors</a>
    .
    <a href="https://discord.gg/uuZrwz4dCS">Discord</a>
  </p>
</p>


[![Github-sponsors](https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/xbgmsharp)
[![License](https://img.shields.io/github/license/xbgmsharp/postgsail)](#license)
[![](https://github.com/xbgmsharp/signalk-postgsail/workflows/Publish%20Node.js%20Package/badge.svg)](https://github.com/xbgmsharp/signalk-postgsail/actions)
[![npm version](https://img.shields.io/npm/v/signalk-postgsail.svg?color=blue
)](https://www.npmjs.com/package/signalk-postgsail)
[![GitHub Repo stars](https://img.shields.io/github/stars/xbgmsharp/postgsail?style=social)](https://github.com/xbgmsharp/postgsail/stargazers)
![Sponsors](https://img.shields.io/github/sponsors/xbgmsharp?logo=github&color=blue)

# postgsail-mcp-server

Model Context Protocol (MCP) server tailored for PostgSail. that provides AI agents with read-only access to PostgSail marine data systems. This server enables Claude and other AI assistants to search and navigate logs, moorages, and stays, monitor and analyze your boat all in one place.

## Installation

* Install Claude App
* Settings -> Extensions
* Drag .MCPB or .DXT files here to install

OR

* Install Claude App.
* Settings -> Extensions -> Advanced settings -> Extension Developer
* Install Extension...

## Key Features

* Daily vessel summaries (current status, weather, systems)
* Voyage planning (reviewing past trips, moorage information)
* System monitoring (battery, solar, sensors, connectivity)
* Historical analysis (tracking patterns, favorite destinations)
* Data export (for external navigation tools)
* Maintenance tracking (through stay notes and logs)

## Available Resources

The server exposes these static reference resources:

- `postgsail://postgsail_overview` - PostgSail overview and core concepts
- `postgsail://path_categories_guide` - Guide to understanding PostgSail paths
- `postgsail://mcp_tool_reference` - Reference for available MCP tools and usage patterns

**Note:** While these resources can be accessed individually via the MCP resource protocol, the `get_initial_context()` tool provides a more convenient way to access all reference materials in a single call, making it the recommended approach for AI agents to understand the system.

## Examples
You can ask anything related to PostgSail all readonly API endpoint are available, eg: Logbook, Moorages, Stays, Monitoring. A few examples:
  * `Provide a daily briefing of <boat_name> systems`
  * `Summarize my last trip`
  * `Summarize my summer sailing voyage`

## License

Apache License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm run test` and `npm run typecheck`
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Review SignalK server logs and configuration
- Open an issue with connection details and error messages