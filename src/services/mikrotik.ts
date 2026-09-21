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

export async function requestRouter<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
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
  const encId = encodeURIComponent(id);
  let lastError: Error | null = null;

  // Try 1: PATCH /ip/hotspot/user/{id} with RouterOS standard string "yes" / "no"
  try {
    await requestRouter(`/ip/hotspot/user/${encId}`, "PATCH", {
      disabled: disabled ? "yes" : "no",
    });
    logAppEvent("admin", "info", `User ${id} ${disabled ? "disabled" : "enabled"}`);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  // Try 2: PATCH /ip/hotspot/user/{id} with boolean literal true/false
  try {
    await requestRouter(`/ip/hotspot/user/${encId}`, "PATCH", {
      disabled: Boolean(disabled),
    });
    logAppEvent("admin", "info", `User ${id} ${disabled ? "disabled" : "enabled"}`);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  // Try 3: POST /ip/hotspot/user/set with numbers: id
  try {
    await requestRouter(`/ip/hotspot/user/set`, "POST", {
      numbers: id,
      disabled: disabled ? "yes" : "no",
    });
    logAppEvent("admin", "info", `User ${id} ${disabled ? "disabled" : "enabled"}`);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  // Try 4: POST /ip/hotspot/user/set with .id
  try {
    await requestRouter(`/ip/hotspot/user/set`, "POST", {
      ".id": id,
      disabled: disabled ? "yes" : "no",
    });
    logAppEvent("admin", "info", `User ${id} ${disabled ? "disabled" : "enabled"}`);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  throw lastError || new Error(`Failed to toggle user ${id} on router`);
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


/** In-memory reverse-DNS cache so we don't re-query the same IP repeatedly */
const rdnsCache = new Map<string, string>();

/**
 * Reverse-DNS lookup for a single IP using Cloudflare DNS-over-HTTPS (1.1.1.1).
 * Returns the PTR hostname (e.g. "lga34s27-in-f14.1e100.net" → simplified) or null.
 */
async function reverseDnsLookup(ip: string): Promise<string | null> {
  if (rdnsCache.has(ip)) return rdnsCache.get(ip)!;
  // Ignore local / private IPs to avoid unnecessary external DNS queries
  if (
    !ip ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  ) {
    return null;
  }
  try {
    // Build PTR query: reverse the octets and append .in-addr.arpa
    const ptr = ip.split(".").reverse().join(".") + ".in-addr.arpa";
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(ptr)}&type=PTR`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { Answer?: Array<{ data: string }> };
    if (!data.Answer?.length) return null;
    // PTR data ends with a dot — trim it
    const hostname = data.Answer[0].data.replace(/\.$/, "");
    rdnsCache.set(ip, hostname);
    return hostname;
  } catch {
    return null;
  }
}

/**
 * Resolve a list of unique IPs to hostnames concurrently (max 15 parallel).
 * Returns a Map<ip, hostname>.
 */
export async function batchReverseDns(ips: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ips)].filter((ip) => ip && !rdnsCache.has(ip));
  // Process in chunks to avoid flooding
  const CHUNK = 15;
  for (let i = 0; i < unique.length; i += CHUNK) {
    await Promise.all(unique.slice(i, i + CHUNK).map(reverseDnsLookup));
  }
  // Return full map including already-cached entries
  const result = new Map<string, string>();
  ips.forEach((ip) => { if (rdnsCache.has(ip)) result.set(ip, rdnsCache.get(ip)!); });
  return result;
}

/** Fetch the router DNS cache and return a Map of IP → hostname.
 *  RouterOS DNS cache format: { name: "example.com", data: "1.2.3.4", type: "A" } */
export async function fetchDnsCache(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/dns/cache");
    if (!Array.isArray(raw)) return map;
    raw.forEach((entry) => {
      const type = String(entry.type || "");
      // Only care about A records: name = hostname, data = IPv4
      if (type !== "A") return;
      const hostname = String(entry.name || "");
      const ip = String(entry.data || "");
      if (hostname && ip && ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        // Also seed the rdns cache so batchReverseDns doesn't re-query these
        if (!rdnsCache.has(ip)) rdnsCache.set(ip, hostname);
        const existing = map.get(ip);
        if (!existing || hostname.length < existing.length) {
          map.set(ip, hostname);
        }
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

export interface StaticDnsRecord {
  id: string;
  name: string;
  address: string;
  ttl?: string;
  comment?: string;
}

export async function fetchStaticDnsRecords(): Promise<StaticDnsRecord[]> {
  try {
    const raw = await requestRouter<Array<Record<string, unknown>>>("/ip/dns/static");
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r[".id"] || r.id || ""),
      name: String(r.name || ""),
      address: String(r.address || ""),
      ttl: String(r.ttl || "5m"),
      comment: String(r.comment || ""),
    }));
  } catch (err) {
    console.warn("Failed to fetch static DNS records:", err);
    return [];
  }
}

export async function ensureStaticDnsRecord(
  domain: string,
  hostIp: string
): Promise<{ ok: boolean; message: string; recordId?: string }> {
  try {
    const existing = await fetchStaticDnsRecords();
    const cleanDomain = domain.trim().toLowerCase();
    const matched = existing.find((r) => r.name.toLowerCase() === cleanDomain);

    if (matched) {
      if (matched.address === hostIp) {
        return {
          ok: true,
          message: `Static DNS record for ${cleanDomain} is already pointing to ${hostIp}`,
          recordId: matched.id,
        };
      }
      // Update existing record
      await requestRouter(`/ip/dns/static/${encodeURIComponent(matched.id)}`, "PATCH", {
        address: hostIp,
        comment: "Managed by Wazobia FastNet Server",
      });
      logAppEvent("system", "info", `Updated static DNS: ${cleanDomain} -> ${hostIp}`);
      return {
        ok: true,
        message: `Updated static DNS record: ${cleanDomain} now points to ${hostIp}`,
        recordId: matched.id,
      };
    }

    // Create new record
    const result = await requestRouter<Record<string, unknown>>("/ip/dns/static", "PUT", {
      name: cleanDomain,
      address: hostIp,
      ttl: "5m",
      comment: "Managed by Wazobia FastNet Server",
    });
    logAppEvent("system", "info", `Created static DNS: ${cleanDomain} -> ${hostIp}`);
    return {
      ok: true,
      message: `Created static DNS entry: ${cleanDomain} -> ${hostIp}`,
      recordId: String(result?.[".id"] || result?.id || ""),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logAppEvent("error", "warn", `Could not update MikroTik static DNS: ${msg}`);
    return {
      ok: false,
      message: `Failed to set static DNS on MikroTik: ${msg}`,
    };
  }
}

