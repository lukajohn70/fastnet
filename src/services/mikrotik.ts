export interface RouterConfig {
  routerIp: string;
  apiPort: string;
  apiUser: string;
  apiPassword: string;
  hotspotProfile: string;
  bridgeInterface: string;
  useSsl: boolean;
}

export interface SystemResource {
  uptime: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  version: string;
  boardName: string;
}

export interface HotspotActiveUser {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: string;
  bytesOut: string;
  loginBy?: string;
}

export interface HotspotUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  comment: string;
  limitUptime: string;
  disabled: boolean;
  bytesIn?: string;
  bytesOut?: string;
}

export interface HotspotProfile {
  id: string;
  name: string;
  rateLimit?: string;
  sharedUsers?: string;
}

export interface RouterLogEntry {
  id: string;
  time: string;
  topics: string;
  message: string;
}

export interface ConnectionEntry {
  id: string;
  srcAddress: string;
  dstAddress: string;
  protocol: string;
  tcpState?: string;
  origBytes: number;
  respBytes: number;
  timeout: string;
  // Resolved
  srcUser?: string;
  dstHost?: string;
}

export interface PaymentRecord {
  ref: string;
  username: string;
  planName: string;
  amount: number;
  timestamp: string;
  status: "paid" | "failed" | "pending";
}

export interface AppSystemLog {
  id: string;
  time: string;
  type: "system" | "admin" | "api_call" | "voucher" | "payment" | "error";
  level: "info" | "warn" | "error";
  event: string;
}

const CONFIG_KEY = "fastnet_router_config";
const PAYMENTS_KEY = "fastnet_payment_records";
const LOGS_KEY = "fastnet_system_logs";

export const DEFAULT_CONFIG: RouterConfig = {
  routerIp: "10.12.12.1",
  apiPort: "80",
  apiUser: "fastnet_api",
  apiPassword: "",
  hotspotProfile: "default",
  bridgeInterface: "bridge1",
  useSsl: false,
};

export function getRouterConfig(): RouterConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

export function saveRouterConfig(config: RouterConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  logAppEvent("system", "info", `Router configuration updated: ${config.routerIp}:${config.apiPort}`);
}

export function getPaymentRecords(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function savePaymentRecord(record: PaymentRecord): void {
  const records = getPaymentRecords();
  records.unshift(record);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(records.slice(0, 500)));
  logAppEvent("payment", record.status === "paid" ? "info" : "warn", `Payment ${record.ref} (${record.status}) for ${record.planName} - ₦${record.amount.toLocaleString()}`);
}

export function getAppSystemLogs(): AppSystemLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function logAppEvent(
  type: AppSystemLog["type"],
  level: AppSystemLog["level"],
  event: string
): void {
  const logs = getAppSystemLogs();
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  logs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    time,
    type,
    level,
    event,
  });
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 300)));
}

function getDirectBaseUrl(cfg: RouterConfig): string {
  const protocol = cfg.useSsl ? "https" : "http";
  return `${protocol}://${cfg.routerIp}:${cfg.apiPort}/rest`;
}

function getAuthHeader(cfg: RouterConfig): string {
  return "Basic " + btoa(`${cfg.apiUser}:${cfg.apiPassword}`);
}

async function requestRouter<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  overrideConfig?: RouterConfig
): Promise<T> {
  const cfg = overrideConfig || getRouterConfig();
  const directBase = getDirectBaseUrl(cfg);
  // Strip leading slash — proxy plugin concatenates target/path itself
  const cleanPath = path.replace(/^\/+/, "");
  const cleanPathWithSlash = `/${cleanPath}`;

  // Try via Vite dev proxy first (bypasses browser CORS & self-signed SSL errors)
  const proxyUrl = `/api/mikrotik?target=${encodeURIComponent(directBase)}&path=${encodeURIComponent(cleanPath)}`;
  const directUrl = `${directBase}${cleanPathWithSlash}`;

  const headers: Record<string, string> = {
    Authorization: getAuthHeader(cfg),
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    // Attempt proxy first
    res = await fetch(proxyUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    // Proxy returns its own 404 only when the /api/mikrotik route doesn't exist
    // (e.g. static build). A RouterOS 404 comes with Content-Type: application/json.
    const isProxyMissing =
      res.status === 404 &&
      !(res.headers.get("content-type") || "").includes("application/json");
    if (isProxyMissing) {
      throw new Error("Proxy not available");
    }
  } catch {
    // Fallback: call the router directly (works only when no CORS block)
    res = await fetch(directUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson.message || errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = res.statusText || `HTTP ${res.status}`;
    }
    throw new Error(`MikroTik API error (${res.status}): ${detail}`);
  }

  // RouterOS returns empty body for some 204 or 200 DELETE/PUT
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function testConnection(overrideConfig?: RouterConfig): Promise<{
  ok: boolean;
  message: string;
  resource?: SystemResource;
}> {
  const start = performance.now();
  try {
    const raw = await requestRouter<Record<string, unknown>>(
      "/system/resource",
      "GET",
      undefined,
      overrideConfig
    );
    const latency = Math.round(performance.now() - start);
    const resource: SystemResource = {
      uptime: String(raw.uptime || "0s"),
      cpuLoad: Number(raw["cpu-load"] ?? 0),
      freeMemory: Number(raw["free-memory"] ?? 0),
      totalMemory: Number(raw["total-memory"] ?? 0),
      version: String(raw.version || "RouterOS v7"),
      boardName: String(raw["board-name"] || "MikroTik Router"),
    };
    logAppEvent("api_call", "info", `Connection test passed to ${overrideConfig?.routerIp || getRouterConfig().routerIp} (${latency}ms)`);
    return {
      ok: true,
      message: `Connected successfully (${latency}ms) — ${resource.boardName} (v${resource.version})`,
      resource,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logAppEvent("error", "error", `Connection test failed: ${msg}`);
    return {
      ok: false,
      message: msg,
    };
  }
}

export async function fetchSystemResource(): Promise<SystemResource | null> {
  try {
    const raw = await requestRouter<Record<string, unknown>>("/system/resource");
    return {
      uptime: String(raw.uptime || "0s"),
      cpuLoad: Number(raw["cpu-load"] ?? 0),
      freeMemory: Number(raw["free-memory"] ?? 0),
      totalMemory: Number(raw["total-memory"] ?? 0),
      version: String(raw.version || "RouterOS v7"),
      boardName: String(raw["board-name"] || "MikroTik Router"),
    };
  } catch (err) {
    console.warn("Failed to fetch system resource:", err);
    return null;
  }
}

export async function fetchActiveSessions(): Promise<HotspotActiveUser[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/hotspot/active");
    if (!Array.isArray(raw)) return [];
    return raw.map((u) => ({
      id: String(u[".id"] || u.id || ""),
      user: String(u.user || ""),
      address: String(u.address || ""),
      macAddress: String(u["mac-address"] || ""),
      uptime: String(u.uptime || ""),
      // Store raw byte counts so the UI can format them
      bytesIn: String(Number(u["bytes-in"] ?? u["rx-bytes"] ?? 0)),
      bytesOut: String(Number(u["bytes-out"] ?? u["tx-bytes"] ?? 0)),
      loginBy: String(u["login-by"] || ""),
    }));
  } catch (err) {
    console.warn("Failed to fetch active sessions:", err);
    return [];
  }
}

export async function fetchHotspotUsers(): Promise<HotspotUser[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/hotspot/user");
    if (!Array.isArray(raw)) return [];
    return raw.map((u) => ({
      id: String(u[".id"] || u.id || ""),
      name: String(u.name || ""),
      password: u.password ? String(u.password) : undefined,
      profile: String(u.profile || "default"),
      comment: String(u.comment || ""),
      limitUptime: String(u["limit-uptime"] || ""),
      disabled: Boolean(u.disabled === true || u.disabled === "true"),
      // Store raw byte counts so the UI can format them
      bytesIn: String(Number(u["bytes-in"] ?? u["uptime-bytes-in"] ?? 0)),
      bytesOut: String(Number(u["bytes-out"] ?? u["uptime-bytes-out"] ?? 0)),
    }));
  } catch (err) {
    console.warn("Failed to fetch hotspot users:", err);
    return [];
  }
}

export async function fetchUserProfiles(): Promise<HotspotProfile[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/hotspot/user-profile");
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => ({
      id: String(p[".id"] || p.id || ""),
      name: String(p.name || ""),
      rateLimit: p["rate-limit"] ? String(p["rate-limit"]) : undefined,
      sharedUsers: p["shared-users"] ? String(p["shared-users"]) : undefined,
    }));
  } catch (err) {
    console.warn("Failed to fetch user profiles:", err);
    return [];
  }
}

export async function createHotspotUser(data: {
  name: string;
  password?: string;
  profile?: string;
  comment?: string;
  limitUptime?: string;
}): Promise<HotspotUser> {
  const cfg = getRouterConfig();
  const payload: Record<string, string> = {
    name: data.name,
    password: data.password || data.name,
    profile: data.profile || cfg.hotspotProfile || "default",
  };
  if (data.comment) payload.comment = data.comment;
  if (data.limitUptime) payload["limit-uptime"] = data.limitUptime;

  const result = await requestRouter<Record<string, unknown>>("/ip/hotspot/user", "PUT", payload);
  logAppEvent("voucher", "info", `Voucher generated on router: ${data.name} (profile: ${payload.profile})`);
  return {
    id: String(result[".id"] || result.id || ""),
    name: data.name,
    password: data.password || data.name,
    profile: payload.profile,
    comment: data.comment || "",
    limitUptime: data.limitUptime || "",
    disabled: false,
  };
}

export async function kickActiveSession(id: string): Promise<void> {
  await requestRouter(`/ip/hotspot/active/${encodeURIComponent(id)}`, "DELETE");
  logAppEvent("admin", "info", `Kicked active session: ${id}`);
}

export async function deleteHotspotUser(id: string): Promise<void> {
  await requestRouter(`/ip/hotspot/user/${encodeURIComponent(id)}`, "DELETE");
  logAppEvent("admin", "info", `Deleted hotspot user: ${id}`);
}

export async function updateHotspotUser(
  id: string,
  data: { profile?: string; comment?: string; limitUptime?: string; password?: string }
): Promise<void> {
  const payload: Record<string, string> = {};
  if (data.profile) payload.profile = data.profile;
  if (data.comment !== undefined) payload.comment = data.comment;
  if (data.limitUptime !== undefined) payload["limit-uptime"] = data.limitUptime;
  if (data.password) payload.password = data.password;
  await requestRouter(`/ip/hotspot/user/${encodeURIComponent(id)}`, "PATCH", payload);
  logAppEvent("admin", "info", `Updated hotspot user: ${id}`);
}

export async function toggleHotspotUser(id: string, disabled: boolean): Promise<void> {
  await requestRouter(`/ip/hotspot/user/${encodeURIComponent(id)}`, "PATCH", { disabled: disabled ? "true" : "false" });
  logAppEvent("admin", "info", `User ${id} ${disabled ? "disabled" : "enabled"}`);
}

export async function fetchConnectionTracking(): Promise<ConnectionEntry[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/firewall/connection");
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 200).map((c) => ({
      id: String(c[".id"] || ""),
      srcAddress: String(c["src-address"] || ""),
      dstAddress: String(c["dst-address"] || ""),
      protocol: String(c.protocol || "unknown"),
      tcpState: c["tcp-state"] ? String(c["tcp-state"]) : undefined,
      origBytes: Number(c["orig-bytes"] ?? 0),
      respBytes: Number(c["repl-bytes"] ?? 0),
      timeout: String(c.timeout || ""),
    }));
  } catch (err) {
    console.warn("Failed to fetch connection tracking:", err);
    return [];
  }
}


/** Fetch the router DNS cache and return a Map of IP → hostname.
 *  This lets us resolve destination IPs in connection tracking to real domain names. */
export async function fetchDnsCache(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/dns/cache");
    if (!Array.isArray(raw)) return map;
    raw.forEach((entry) => {
      const name = String(entry.name || entry.address || "");
      const address = String(entry.address || entry.data || "");
      if (name && address && address.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        // address is an IP → map it to the hostname
        if (!map.has(address)) map.set(address, name);
      }
    });
  } catch (err) {
    console.warn("Failed to fetch DNS cache:", err);
  }
  return map;
}

export async function fetchRouterLogs(): Promise<RouterLogEntry[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/log");
    if (!Array.isArray(raw)) return [];
    return raw.slice(-100).reverse().map((l) => ({
      id: String(l[".id"] || l.id || ""),
      time: String(l.time || ""),
      topics: String(l.topics || "info"),
      message: String(l.message || ""),
    }));
  } catch (err) {
    console.warn("Failed to fetch router logs:", err);
    return [];
  }
}

export function generateVoucherCode(prefix: string = "fast"): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${random}`.toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
