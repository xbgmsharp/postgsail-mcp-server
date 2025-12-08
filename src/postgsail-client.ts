// PostgSail API Client
class PostgSailClient {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string, token?: string) {
    this.baseURL = baseURL.endsWith("/") ? baseURL : baseURL + "/";
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "postgsail.mcp v0.0.5",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      throw new Error(
        `Request to ${endpoint} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  setToken(value: string) {
    this.token = value;
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request("rpc/login", {
      method: "POST",
      body: JSON.stringify({ email: email, pass: password }),
    });
  }

  // Vessel methods
  async getVessels() {
    return this.request("vessels_view");
  }

  async getVessel() {
    return this.request("rpc/vessel_fn");
  }

  async getVesselPolar() {
    return this.request("metadata_ext?select=polar,polar_updated_at");
  }

  // Logs methods
  async getLogs() {
    return this.request("logs_view?limit=5");
  }

  async getLastLog() {
    return this.request(`log_view?limit=1`);
  }

  async getLog(id: string) {
    return this.request(`log_view?id=eq.${id}`);
  }

  async getLogsGeoJSON() {
    return this.request(
      "log_view?select=geojson&geojson=not.is.null&order=started.desc&limit=5"
    );
  }

  async getLogsMap(page = 1) {
    const limit = 100;
    const offset = (page - 1) * limit;
    return this.request(
      `logs_geojson_view?select=geojson&geojson=not.is.null&order=starttimestamp.desc&limit=${limit}&offset=${offset}`,
      {
        headers: { Prefer: "count=exact" },
      }
    );
  }

  async exportLogGPX(logId: string) {
    return this.request("rpc/export_logbook_gpx_trip_fn", {
      method: "POST",
      headers: { Accept: "text/xml" },
      body: JSON.stringify({ _id: logId }),
    });
  }

  async exportLogGeoJSON(logId: string) {
    return this.request("rpc/export_logbook_geojson_trip_fn", {
      method: "POST",
      body: JSON.stringify({ _id: logId }),
    });
  }

  async exportLogKML(logId: string) {
    return this.request("rpc/export_logbook_kml_trip_fn", {
      method: "POST",
      body: JSON.stringify({ _id: logId }),
    });
  }

  // Moorages methods
  async getMoorages() {
    return this.request("moorages_view?limit=5");
  }

  async getMoorage(id: string) {
    return this.request(`moorage_view?id=eq.${id}`);
  }

  async getMooragesGeoJSON() {
    return this.request("rpc/export_moorages_geojson_fn", { method: "POST" });
  }

  async getMoorageStays(id: string) {
    return this.request(`moorages_stays_view?id=eq.${id}`);
  }

  async getMoorageArrivalsDepartures(id: string) {
    return this.request(
      `logs_view?or=(_from_moorage_id.eq.${id},_to_moorage_id.eq.${id})`
    );
  }

  // Stays methods
  async getStays() {
    return this.request("stays_view?limit=5");
  }

  async getStay(id: string) {
    return this.request(`stay_view?id=eq.${id}`);
  }

  async getStaysMap(page = 1) {
    const limit = 100;
    const offset = (page - 1) * limit;
    return this.request(
      `stays_geojson_view?select=geojson&geojson=not.is.null&limit=${limit}&offset=${offset}`,
      {
        headers: { Prefer: "count=exact" },
      }
    );
  }

  // Monitoring methods
  async getMonitoring() {
    return this.request("monitoring_view");
  }

  async getMonitoringLive() {
    return this.request("monitoring_live");
  }

  async getMonitoringHistory(payload: any) {
    return this.request("rpc/monitoring_history_fn", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Stats methods
  async getStatsLogs() {
    return this.request("stats_logs_view");
  }

  async getStatsMoorages() {
    return this.request("stats_moorages_view");
  }

  async getStats(payload: any) {
    return this.request("rpc/stats_fn", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Charts methods
  async getTotalInfo() {
    return this.request("total_info_view");
  }

  async getLogsByMonth() {
    return this.request("rpc/logs_by_month_fn");
  }

  // Event logs
  async getEventLogs() {
    return this.request("eventlogs_view");
  }

  // Badges
  async getBadges() {
    return this.request("badges_view");
  }

  // User settings
  async getSettings() {
    return this.request("rpc/settings_fn");
  }

  // Vessel Mapping singalk
  async getVesselMapping() {
    return this.request("metadata?select=configuration,available_keys");
  }

  // Timelapse
  async getTimelapse(payload: any) {
    return this.request("rpc/timelapse_fn", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTimelapseTrips(payload: string) {
    return this.request(
      `rpc/export_logbooks_geojson_point_trips_fn?${payload}`
    );
  }
}

export default PostgSailClient;
