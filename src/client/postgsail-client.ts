export class AuthError extends Error {
  status: number;
  constructor(status: number) {
    super(`Authentication failed: HTTP ${status}`);
    this.name = "AuthError";
    this.status = status;
  }
}

const stayTypeToId: Record<string, number> = {
  All: -1, // Use -1 or omit to fetch all types
  Unknown: 1,
  Anchor: 2,
  Dock: 4,
  "Mooring Buoy": 3,
};

export type ViewResult = {
  data: any;
  totalCount: number | null;
  range: string | null;
};

// PostgSail API Client
class PostgSailClient {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    if (!baseURL) {
      throw new Error("PostgSailClient requires a baseURL");
    }
    this.baseURL = baseURL.endsWith("/") ? baseURL : baseURL + "/";
  }

  /**
   * For view/table endpoints — returns { data, totalCount, range } for JSON,
   * or a raw string for non-JSON content (XML, text).
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ViewResult | string> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "postgsail.mcp v0.0.6",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[PostgSailClient] → ${options.method ?? "GET"} ${url}`);
    }
    try {
      const response = await fetch(url, { ...options, headers });

      if (process.env.NODE_ENV === "development") {
        console.log(`[PostgSailClient] ← ${response.status} ${response.statusText} (${url})`);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthError(response.status);
      }

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      // Extract total count from Content-Range header (format: "0-49/200")
      const contentRange = response.headers.get("Content-Range");
      let totalCount: number | null = null;
      if (contentRange) {
        const match = contentRange.match(/\/(\d+|\*)$/);
        if (match && match[1] !== "*") {
          totalCount = parseInt(match[1], 10);
        }
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        return { data, totalCount, range: contentRange };
      }
      return await response.text();
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new Error(
        `Request to ${endpoint} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * For RPC functions that return a single JSON object (not a paginated list).
   * Returns raw parsed JSON or text — no pagination wrapper.
   */
  private async requestRPC(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "postgsail.mcp v0.0.7",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[PostgSailClient] → ${options.method ?? "GET"} ${url}`);
    }
    try {
      const response = await fetch(url, { ...options, headers });

      if (process.env.NODE_ENV === "development") {
        console.log(`[PostgSailClient] ← ${response.status} ${response.statusText} (${url})`);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AuthError(response.status);
      }

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
      if (error instanceof AuthError) throw error;
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
    return this.requestRPC("rpc/login", {
      method: "POST",
      body: JSON.stringify({ email: email, pass: password }),
    });
  }

  // Vessel methods
  async getVessels() {
    return this.request("vessels_view");
  }

  async getVessel() {
    return this.requestRPC("rpc/vessel_fn");
  }

  async getVesselPolar() {
    return this.request("metadata_ext?select=polar,polar_updated_at");
  }

  // Logs methods
  async getLogs({
    start_date,
    end_date,
    distance,
    duration,
    tags,
    limit = 10,
    offset = 0,
  }: {
    start_date?: string;
    end_date?: string;
    distance?: number;
    duration?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}) {
    let query = `logs_view?limit=${limit}&offset=${offset}`;

    const filters = [];

    if (start_date) filters.push(`started=gte.${start_date}`);
    if (end_date) filters.push(`ended=lte.${end_date}`);
    if (distance) filters.push(`distance=gte.${distance}`);
    if (duration) filters.push(`duration=gte.PT${duration}H`);
    if (tags && tags.length > 0)
      filters.push(`tags=cs.[${JSON.stringify(tags)}]`);

    if (filters.length > 0) {
      query += `&${filters.join("&")}`;
    }
    return this.request(query, {
      headers: { Prefer: "count=exact" },
    });
  }

  async getLastLog() {
    return this.request(`log_view?limit=1`);
  }

  async getLog(id: string) {
    return this.request(`log_view?id=eq.${id}`);
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
      headers: { Accept: "text/xml" },
      body: JSON.stringify({ _id: logId }),
    });
  }

  // Moorages methods
  async getMoorages({
    default_stay_type = "All",
    limit = 10,
    offset = 0,
  }: {
    default_stay_type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = `moorages_view?limit=${limit}&offset=${offset}`;

    const stayTypeId = stayTypeToId[default_stay_type];
    if (stayTypeId !== undefined && stayTypeId !== -1) {
      query += `&default_stay_id=eq.${stayTypeId}`;
    }

    return this.request(query, {
      headers: { Prefer: "count=exact" },
    });
  }

  async getMoorage(id: string) {
    return this.request(`moorage_view?id=eq.${id}`);
  }

  async getMooragesMap(page = 1) {
    const limit = 100;
    const offset = (page - 1) * limit;
    return this.request(
      `moorages_geojson_view?select=geojson&geojson=not.is.null&limit=${limit}&offset=${offset}`,
      {
        headers: { Prefer: "count=exact" },
      }
    );
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
  async getStays({
    arrived,
    departed,
    stay_type = "All",
    duration,
    limit = 10,
    offset = 0,
  }: {
    arrived?: string;
    departed?: string;
    stay_type?: string;
    duration?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = `stays_view?limit=${limit}&offset=${offset}`;

    const filters = [];

    if (arrived) filters.push(`arrived=gte.${arrived}`);
    if (departed) filters.push(`departed=lte.${departed}`);
    if (duration) filters.push(`duration=gte.PT${duration}H`);

    const stayTypeId = stayTypeToId[stay_type];
    if (stayTypeId !== undefined && stayTypeId !== -1) {
      filters.push(`stayed_at_id=eq.${stayTypeId}`);
    }

    if (filters.length > 0) {
      query += `&${filters.join("&")}`;
    }

    return this.request(query, {
      headers: { Prefer: "count=exact" },
    });
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

  async getLogsByMonth() {
    return this.request("rpc/logs_by_month_fn");
  }

  async getLogsByWeek() {
    return this.request("rpc/logs_by_week_fn");
  }

  async getLogsByDay() {
    return this.request("rpc/logs_by_day_fn");
  }

  // Event logs
  async getEventLogs() {
    return this.request("eventlogs_view");
  }

  // Badges
  async getBadges() {
    return this.request("rpc/badges_fn");
  }

  // User profile
  async getProfile() {
    return this.requestRPC("rpc/profile_fn");
  }

  // Vessel Mapping SignalK
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
