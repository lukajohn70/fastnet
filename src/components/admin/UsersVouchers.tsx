import { useState, useEffect, useMemo, useRef } from "react";
import BatchModal from "./BatchModal";
import {
  fetchHotspotUsers,
  fetchActiveSessions,
  fetchUserProfiles,
  fetchConnectionTracking,
  fetchDnsCache,
  batchReverseDns,
  createHotspotUser,
  updateHotspotUser,
  toggleHotspotUser,
  deleteHotspotUser,
  kickActiveSession,
  generateVoucherCode,
  formatBytes,
  type HotspotUser,
  type HotspotActiveUser,
  type HotspotProfile,
  type ConnectionEntry,
} from "../../services/mikrotik";

export interface DisplayUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  comment: string;
  limitUptime: string;
  status: "active" | "offline" | "disabled";
  ip?: string;
  mac?: string;
  uptime?: string;
  bytesIn?: string;
  bytesOut?: string;
  activeId?: string;
  rawDisabled: boolean;
}

type SortKey = "name" | "profile" | "status" | "uptime" | "bytesIn" | "bytesOut";
type SortDir = "asc" | "desc";

type ModalState =
  | { type: "view"; user: DisplayUser }
  | { type: "edit"; user: DisplayUser }
  | { type: "add" }
  | { type: "kick"; user: DisplayUser }
  | { type: "delete"; user: DisplayUser }
  | { type: "connections"; user: DisplayUser }
  | null;

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  offline: "bg-gray-100 text-gray-500 border border-gray-200",
  disabled: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  offline: "bg-gray-400",
  disabled: "bg-red-500",
};

function SortIcon({ dir }: { dir?: SortDir }) {
  if (!dir) return (
    <svg viewBox="0 0 10 14" className="w-2.5 h-3.5 opacity-30" fill="currentColor">
      <path d="M5 0L9 5H1L5 0zm0 14L1 9h8L5 14z"/>
    </svg>
  );
  return dir === "asc" ? (
    <svg viewBox="0 0 10 7" className="w-2.5 h-3 text-[#2563EB]" fill="currentColor"><path d="M5 0L9 7H1L5 0z"/></svg>
  ) : (
    <svg viewBox="0 0 10 7" className="w-2.5 h-3 text-[#2563EB]" fill="currentColor"><path d="M5 7L1 0h8L5 7z"/></svg>
  );
}

export default function UsersVouchers() {
  const [tab, setTab] = useState<"users" | "connections">("users");
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionEntry[]>([]);
  const [dnsMap, setDnsMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [connLoading, setConnLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [connSearch, setConnSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sessions, setSessions] = useState<HotspotActiveUser[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const [hUsers, aSessions, hProfiles] = await Promise.all([
        fetchHotspotUsers(),
        fetchActiveSessions(),
        fetchUserProfiles(),
      ]);
      setSessions(aSessions);
      setProfiles(hProfiles);

      const activeMap = new Map<string, HotspotActiveUser>();
      aSessions.forEach((s) => activeMap.set(s.user, s));

      const combined: DisplayUser[] = hUsers.map((u) => {
        const active = activeMap.get(u.name);
        return {
          id: u.id,
          name: u.name,
          password: u.password,
          profile: u.profile,
          comment: u.comment || "",
          limitUptime: u.limitUptime || "",
          status: u.disabled ? "disabled" : active ? "active" : "offline",
          ip: active?.address || "",
          mac: active?.macAddress || "",
          uptime: active?.uptime || "",
          bytesIn: active?.bytesIn || u.bytesIn || "0",
          bytesOut: active?.bytesOut || u.bytesOut || "0",
          activeId: active?.id,
          rawDisabled: u.disabled,
        };
      });

      aSessions.forEach((s) => {
        if (!hUsers.some((u) => u.name === s.user)) {
          combined.push({
            id: s.id,
            name: s.user,
            profile: "active",
            comment: s.loginBy || "guest",
            limitUptime: "",
            status: "active",
            ip: s.address,
            mac: s.macAddress,
            uptime: s.uptime,
            bytesIn: s.bytesIn,
            bytesOut: s.bytesOut,
            activeId: s.id,
            rawDisabled: false,
          });
        }
      });

      setUsers(combined);
    } catch (err) {
      console.warn("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    setConnLoading(true);
    try {
      // 1. Fetch connections + router DNS cache in parallel
      const [conns, routerDns] = await Promise.all([
        fetchConnectionTracking(),
        fetchDnsCache(),
      ]);

      // 2. Build user IP → username map
      const ipToUser = new Map<string, string>();
      sessions.forEach((s) => ipToUser.set(s.address.split(":")[0], s.user));

      // 3. Collect all unique destination IPs for reverse-DNS
      const dstIps = [...new Set(conns.map((c) => c.dstAddress.split(":")[0]))];

      // 4. Run reverse-DNS on all destination IPs (uses Cloudflare DoH)
      const rdns = await batchReverseDns(dstIps);

      // 5. Merge router DNS + reverse-DNS (prefer router DNS cache since it has actual user-visited domains, fallback to reverse-DNS PTR)
      const mergedDns = new Map<string, string>([...rdns]);
      routerDns.forEach((hostname, ip) => {
        mergedDns.set(ip, hostname);
      });
      setDnsMap(mergedDns);

      // 6. Annotate connections with resolved user + hostname
      const annotated = conns.map((c) => {
        const srcIp = c.srcAddress.split(":")[0];
        const dstIp = c.dstAddress.split(":")[0];
        return {
          ...c,
          srcUser: ipToUser.get(srcIp),
          dstHost: mergedDns.get(dstIp),
        };
      });
      setConnections(annotated);
    } catch {
      setConnections([]);
    } finally {
      setConnLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === "connections") loadConnections(); }, [tab]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let list = users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        u.name.toLowerCase().includes(q) ||
        u.comment.toLowerCase().includes(q) ||
        u.profile.toLowerCase().includes(q) ||
        (u.ip || "").includes(q) ||
        (u.mac || "").toLowerCase().includes(q);
      const matchFilter = filter === "all" || u.status === filter;
      return matchSearch && matchFilter;
    });

    list = [...list].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      switch (sortKey) {
        case "name": va = a.name; vb = b.name; break;
        case "profile": va = a.profile; vb = b.profile; break;
        case "status": va = a.status; vb = b.status; break;
        case "uptime": va = a.uptime || ""; vb = b.uptime || ""; break;
        case "bytesIn": va = Number(a.bytesIn) || 0; vb = Number(b.bytesIn) || 0; break;
        case "bytesOut": va = Number(a.bytesOut) || 0; vb = Number(b.bytesOut) || 0; break;
      }
      if (typeof va === "number") return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return list;
  }, [users, search, filter, sortKey, sortDir]);

  const filteredConns = useMemo(() => {
    if (!connSearch) return connections;
    const q = connSearch.toLowerCase();
    return connections.filter(
      (c) =>
        c.srcAddress.includes(q) ||
        c.dstAddress.includes(q) ||
        (c.srcUser || "").toLowerCase().includes(q) ||
        c.protocol.includes(q)
    );
  }, [connections, connSearch]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((u) => u.id)));

  const handleKick = async (user: DisplayUser) => {
    if (!user.activeId) return;
    setActionLoading(true); setActionError("");
    try { await kickActiveSession(user.activeId); await loadUsers(); setModal(null); }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (user: DisplayUser) => {
    setActionLoading(true); setActionError("");
    try { await deleteHotspotUser(user.id); await loadUsers(); setModal(null); }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleToggle = async (user: DisplayUser) => {
    setActionLoading(true);
    try { await toggleHotspotUser(user.id, !user.rawDisabled); await loadUsers(); }
    catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    setActionLoading(true);
    for (const id of selected) {
      try { await deleteHotspotUser(id); } catch { /* skip */ }
    }
    await loadUsers();
    setActionLoading(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Username", "Profile", "Comment", "Uptime Limit", "Status", "IP", "MAC"],
      ...filtered.map((u) => [u.name, u.profile, u.comment, u.limitUptime, u.status, u.ip || "", u.mac || ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `fastnet_vouchers_${Date.now()}.csv`;
    a.click();
  };

  const Th = ({ label, sk }: { label: string; sk?: SortKey }) => (
    <th
      className={`py-3 px-4 select-none whitespace-nowrap ${sk ? "cursor-pointer hover:text-[#2563EB] transition-colors" : ""}`}
      onClick={() => sk && handleSort(sk)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sk && <SortIcon dir={sortKey === sk ? sortDir : undefined} />}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 w-fit">
        {(["users", "connections"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-[#2563EB] text-white shadow-md shadow-blue-200" : "text-[#6B7280] hover:text-[#1F2937]"}`}
          >
            {t === "users" ? "👤 Vouchers & Users" : "🔍 IP Connections"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name / IP / MAC / tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] w-56"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                <option value="all">All ({users.length})</option>
                <option value="active">Active ({users.filter((u) => u.status === "active").length})</option>
                <option value="offline">Offline ({users.filter((u) => u.status === "offline").length})</option>
                <option value="disabled">Disabled ({users.filter((u) => u.status === "disabled").length})</option>
              </select>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1.5 transition-colors"
              >
                <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2563EB]" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
                </svg>
                {loading ? "Loading..." : "Refresh"}
              </button>
              {selected.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1.5 rounded-lg">
                    {selected.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={actionLoading}
                    className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-[#374151] font-semibold text-sm px-4 py-2 rounded-xl transition-all"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 2v9M4 8l4 4 4-4M3 13h10" />
                </svg>
                CSV
              </button>
              <button
                onClick={() => setModal({ type: "add" })}
                className="flex items-center gap-1.5 border border-[#2563EB]/30 bg-white hover:bg-blue-50 text-[#2563EB] font-semibold text-sm px-4 py-2 rounded-xl transition-all"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 3v10M3 8h10" />
                </svg>
                Add Voucher
              </button>
              <button
                onClick={() => setBatchOpen(true)}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-200 transition-all"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/>
                  <rect x="2" y="9" width="5" height="5" rx="1"/><path d="M11.5 9v6M9 11.5h5" />
                </svg>
                Batch Generate
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold">
                    <th className="py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded accent-[#2563EB] cursor-pointer"
                      />
                    </th>
                    <Th label="Username / Voucher" sk="name" />
                    <Th label="Profile" sk="profile" />
                    <th className="py-3 px-4">Tag / Comment</th>
                    <th className="py-3 px-4">Uptime Limit</th>
                    <Th label="Status" sk="status" />
                    <th className="py-3 px-4">IP / MAC</th>
                    <Th label="Down" sk="bytesIn" />
                    <Th label="Up" sk="bytesOut" />
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-[#9CA3AF]">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 animate-spin text-[#2563EB]" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,0.2)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Loading vouchers from MikroTik router...
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-[#9CA3AF]">
                        <p className="font-semibold text-gray-600 mb-1">No vouchers found</p>
                        <p className="text-xs text-gray-400">Use "Add Voucher" or "Batch Generate" to create vouchers.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-blue-50/30 transition-colors ${selected.has(u.id) ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selected.has(u.id)}
                            onChange={() => toggleSelect(u.id)}
                            className="w-3.5 h-3.5 rounded accent-[#2563EB] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setModal({ type: "view", user: u })}
                            className="font-mono font-semibold text-[#1F2937] hover:text-[#2563EB] transition-colors text-left"
                          >
                            {u.name}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold px-2 py-0.5 rounded-full">
                            {u.profile}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] max-w-[130px] truncate text-xs" title={u.comment}>
                          {u.comment || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                          {u.limitUptime || <span className="text-gray-300">Unlimited</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1.5 w-fit ${STATUS_STYLE[u.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[u.status]}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                          <div>{u.ip || "-"}</div>
                          <div className="text-[10px] text-gray-400">{u.mac || ""}</div>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                          {formatBytes(Number(u.bytesIn) || 0)}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                          {formatBytes(Number(u.bytesOut) || 0)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setModal({ type: "view", user: u })}
                              title="View details"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M1.5 8s2-4.5 6.5-4.5S14.5 8 14.5 8s-2 4.5-6.5 4.5S1.5 8 1.5 8z" />
                                <circle cx="8" cy="8" r="2" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setModal({ type: "edit", user: u })}
                              title="Edit user"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#2563EB] transition-colors"
                            >
                              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" />
                              </svg>
                            </button>
                            {u.status === "active" && (
                              <button
                              onClick={() => {
                                setModal({ type: "connections", user: u });
                                // Always refresh connections when opening this modal
                                loadConnections();
                              }}
                                title="View IP connections"
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                              >
                                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                  <circle cx="4" cy="8" r="2.5" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" />
                                  <path d="M6.5 7L10 5M6.5 9L10 11" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleToggle(u)}
                              title={u.rawDisabled ? "Enable user" : "Disable user"}
                              className={`p-1.5 rounded-lg transition-colors ${u.rawDisabled ? "hover:bg-emerald-50 text-gray-400 hover:text-emerald-600" : "hover:bg-amber-50 text-gray-400 hover:text-amber-600"}`}
                            >
                              {u.rawDisabled ? (
                                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                  <path d="M3 8h10M8 3v10" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                  <circle cx="8" cy="8" r="6" /><path d="M6 8l1.5 1.5 3-3" />
                                </svg>
                              )}
                            </button>
                            {u.status === "active" && (
                              <button
                                onClick={() => setModal({ type: "kick", user: u })}
                                title="Kick session"
                                className="text-xs text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg font-semibold transition-colors"
                              >
                                Kick
                              </button>
                            )}
                            <button
                              onClick={() => setModal({ type: "delete", user: u })}
                              title="Delete user"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9.5h5L11 4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && (
              <div className="px-4 py-2.5 border-t border-gray-50 bg-[#F9FAFB] flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">
                  Showing {filtered.length} of {users.length} vouchers
                </span>
                <span className="text-xs text-[#9CA3AF]">
                  {users.filter((u) => u.status === "active").length} active &nbsp;&middot;&nbsp;
                  {users.filter((u) => u.status === "offline").length} offline &nbsp;&middot;&nbsp;
                  {users.filter((u) => u.status === "disabled").length} disabled
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "connections" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
              </svg>
              <input
                type="text"
                placeholder="Filter by IP, user, protocol..."
                value={connSearch}
                onChange={(e) => setConnSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] w-full"
              />
            </div>
            <button
              onClick={loadConnections}
              disabled={connLoading}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1.5 transition-colors"
            >
              <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${connLoading ? "animate-spin text-[#2563EB]" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
              </svg>
              {connLoading ? "Refreshing..." : "Refresh"}
            </button>
            <span className="text-xs text-[#9CA3AF] bg-white border border-gray-100 px-3 py-2 rounded-xl">
              {filteredConns.length} connections
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-[#F9FAFB] flex items-center gap-2">
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="4" cy="8" r="2.5" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" />
                <path d="M6.5 7L10 5M6.5 9L10 11" />
              </svg>
              <h3 className="text-[#1F2937] font-semibold text-sm">Live IP Connection Tracking</h3>
              <span className="ml-auto text-xs text-[#9CA3AF]">Source: /ip/firewall/connection</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[#6B7280] font-semibold">
                    <th className="py-2.5 px-4">Hotspot User</th>
                    <th className="py-2.5 px-4">Source IP:Port</th>
                    <th className="py-2.5 px-4">Destination IP:Port</th>
                    <th className="py-2.5 px-4">Protocol</th>
                    <th className="py-2.5 px-4">TCP State</th>
                    <th className="py-2.5 px-4">Rx</th>
                    <th className="py-2.5 px-4">Tx</th>
                    <th className="py-2.5 px-4">Timeout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {connLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#9CA3AF]">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin text-[#2563EB]" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,0.2)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Loading connections from router...
                        </div>
                      </td>
                    </tr>
                  ) : filteredConns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#9CA3AF]">
                        No connections found. Make sure connection tracking is enabled on the router.
                      </td>
                    </tr>
                  ) : (
                    filteredConns.map((c) => {
                      const dstIp = c.dstAddress.split(":")[0];
                      const dstPort = c.dstAddress.split(":")[1];
                      const portLabel: Record<string, string> = { "80": "HTTP", "443": "HTTPS", "53": "DNS", "25": "SMTP", "587": "SMTP" };
                      const isHTTPS = dstPort === "443";
                      const isHTTP = dstPort === "80";
                      const hostname = c.dstHost || dnsMap.get(dstIp);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 px-4">
                            {c.srcUser ? (
                              <span className="bg-blue-50 text-[#2563EB] font-semibold px-2 py-0.5 rounded-full text-[11px]">
                                {c.srcUser}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-[11px]">unknown</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[#1F2937] text-[11px]">{c.srcAddress}</td>
                          <td className="py-2.5 px-4">
                            {hostname ? (
                              <div>
                                <div className="text-[#1F2937] font-semibold text-[12px] max-w-[180px] truncate" title={hostname}>
                                  {hostname}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  {dstIp}{dstPort && `:${dstPort}`}
                                  {dstPort && portLabel[dstPort] && <span className={`ml-1 font-semibold ${isHTTPS ? "text-emerald-600" : isHTTP ? "text-amber-600" : "text-gray-400"}`}>({portLabel[dstPort]})</span>}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-[#1F2937] font-mono text-[12px]">{dstIp}</div>
                                {dstPort && (
                                  <div className={`text-[10px] font-semibold ${isHTTPS ? "text-emerald-600" : isHTTP ? "text-amber-600" : "text-gray-400"}`}>
                                    :{dstPort}{portLabel[dstPort] ? ` (${portLabel[dstPort]})` : ""}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.protocol === "tcp" ? "bg-blue-50 text-blue-600" : c.protocol === "udp" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                              {c.protocol.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#6B7280]">{c.tcpState || "-"}</td>
                          <td className="py-2.5 px-4 font-mono text-[#6B7280]">{formatBytes(c.origBytes)}</td>
                          <td className="py-2.5 px-4 font-mono text-[#6B7280]">{formatBytes(c.respBytes)}</td>
                          <td className="py-2.5 px-4 font-mono text-[#9CA3AF]">{c.timeout}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {batchOpen && (
        <BatchModal onClose={() => setBatchOpen(false)} onSuccess={loadUsers} />
      )}

      {modal?.type === "view" && (
        <UserDetailModal user={modal.user} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", user: modal.user })} />
      )}

      {modal?.type === "add" && (
        <AddEditModal
          profiles={profiles}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            setActionLoading(true); setActionError("");
            try { await createHotspotUser(data); await loadUsers(); setModal(null); }
            catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed to create user"); }
            finally { setActionLoading(false); }
          }}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {modal?.type === "edit" && (
        <AddEditModal
          user={modal.user}
          profiles={profiles}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            setActionLoading(true); setActionError("");
            try { await updateHotspotUser(modal.user.id, data); await loadUsers(); setModal(null); }
            catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed to update user"); }
            finally { setActionLoading(false); }
          }}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {modal?.type === "connections" && (
        <UserConnectionsModal
          user={modal.user}
          allConnections={connections}
          sessions={sessions}
          dnsMap={dnsMap}
          onClose={() => setModal(null)}
          onRefresh={loadConnections}
          loading={connLoading}
        />
      )}

      {modal?.type === "kick" && (
        <ConfirmModal
          title="Kick Active Session"
          description={<>Disconnect <span className="font-mono font-bold">{modal.user.name}</span> ({modal.user.ip}) from the network?</>}
          confirmLabel="Kick Session"
          confirmClass="bg-amber-500 hover:bg-amber-600"
          loading={actionLoading}
          error={actionError}
          onConfirm={() => handleKick(modal.user)}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmModal
          title="Delete Voucher"
          description={<>Permanently remove voucher <span className="font-mono font-bold">{modal.user.name}</span> from the router?</>}
          confirmLabel="Delete Voucher"
          confirmClass="bg-red-600 hover:bg-red-700"
          loading={actionLoading}
          error={actionError}
          onConfirm={() => handleDelete(modal.user)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose, onEdit }: {
  user: DisplayUser;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base font-mono">{user.name}</h3>
            <p className="text-blue-200 text-xs mt-0.5">{user.profile} &middot; {user.status}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors">
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-1">
          {([
            ["Username", user.name],
            ["Password", user.password || "-"],
            ["Profile", user.profile],
            ["Comment / Tag", user.comment || "-"],
            ["Uptime Limit", user.limitUptime || "Unlimited"],
            ["Status", user.status],
            ["IP Address", user.ip || "-"],
            ["MAC Address", user.mac || "-"],
            ["Session Uptime", user.uptime || "-"],
            ["Data Down", formatBytes(Number(user.bytesIn) || 0)],
            ["Data Up", formatBytes(Number(user.bytesOut) || 0)],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-[#6B7280] font-medium">{label}</span>
              <span className="text-xs font-mono font-semibold text-[#1F2937]">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
            Close
          </button>
          <button onClick={onEdit} className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-200 transition-all">
            Edit User
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEditModal({ user, profiles, onClose, onSave, loading, error }: {
  user?: DisplayUser;
  profiles: HotspotProfile[];
  onClose: () => void;
  onSave: (data: { name: string; password?: string; profile?: string; comment?: string; limitUptime?: string }) => Promise<void>;
  loading: boolean;
  error: string;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name || generateVoucherCode("fast"));
  const [password, setPassword] = useState(user?.password || "");
  const [profile, setProfile] = useState(user?.profile || profiles[0]?.name || "default");
  const [comment, setComment] = useState(user?.comment || "");
  const [limitUptime, setLimitUptime] = useState(user?.limitUptime || "");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.select(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">{isEdit ? "Edit Voucher" : "New Voucher"}</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#374151] block mb-1">Username / Voucher Code</label>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isEdit}
                placeholder="e.g. fast_A3K9P"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Leave blank to keep" : "Same as username"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Profile</label>
              {profiles.length > 0 ? (
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  placeholder="default"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Comment / Tag</label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Table 5 or John Doe"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1">Uptime Limit</label>
              <input
                value={limitUptime}
                onChange={(e) => setLimitUptime(e.target.value)}
                placeholder="e.g. 01:00:00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
          <button
            onClick={() => onSave({ name, password: password || undefined, profile, comment, limitUptime: limitUptime || undefined })}
            disabled={loading || !name.trim()}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
          >
            {loading && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>}
            {isEdit ? "Save Changes" : "Create Voucher"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserConnectionsModal({ user, allConnections, sessions, dnsMap, onClose, onRefresh, loading }: {
  user: DisplayUser;
  allConnections: ConnectionEntry[];
  sessions: HotspotActiveUser[];
  dnsMap: Map<string, string>;
  onClose: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const userConns = useMemo(() => {
    const userIp = user.ip || sessions.find((s) => s.user === user.name)?.address?.split(":")[0];
    return allConnections.filter(
      (c) => (userIp && c.srcAddress.startsWith(userIp)) || (c.srcUser && c.srcUser === user.name)
    );
  }, [allConnections, sessions, user.name, user.ip]);

  const portLabel: Record<string, string> = { "80": "HTTP", "443": "HTTPS", "53": "DNS", "25": "SMTP", "587": "SMTP", "22": "SSH", "21": "FTP" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Connections - {user.name}</h3>
            <p className="text-purple-200 text-xs mt-0.5">IP: {user.ip || "unknown"} &middot; {userConns.length} connections</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} disabled={loading} className="text-purple-200 hover:text-white p-1.5 rounded-lg transition-colors">
              <svg viewBox="0 0 16 16" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
              </svg>
            </button>
            <button onClick={onClose} className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors">
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#9CA3AF]">
              <svg className="w-5 h-5 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(139,92,246,0.2)" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0110 10" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Fetching live connections from router...
            </div>
          ) : userConns.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#9CA3AF]">
              <p className="font-semibold text-gray-500 mb-1">No connections found for this user</p>
              <p className="text-xs">The user may have no active connections, or connection tracking may be disabled on the router.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[#6B7280] font-semibold sticky top-0">
                  <th className="py-2.5 px-4">Destination</th>
                  <th className="py-2.5 px-4">Port / Service</th>
                  <th className="py-2.5 px-4">Proto</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4">Rx</th>
                  <th className="py-2.5 px-4">Tx</th>
                  <th className="py-2.5 px-4">Timeout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {userConns.map((c) => {
                  const dstIp = c.dstAddress.split(":")[0];
                  const dstPort = c.dstAddress.split(":")[1];
                  const isHTTPS = dstPort === "443";
                  const isHTTP = dstPort === "80";
                  const hostname = c.dstHost || dnsMap.get(dstIp);
                  return (
                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-4">
                        {hostname ? (
                          <div>
                            <div className="text-[#1F2937] font-semibold text-[12px] max-w-[200px] truncate" title={hostname}>
                              {hostname}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">{dstIp}</div>
                          </div>
                        ) : (
                          <span className="font-mono text-[#1F2937] font-semibold text-[12px]">{dstIp}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isHTTPS ? "bg-emerald-50 text-emerald-700" : isHTTP ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                          :{dstPort}{portLabel[dstPort] ? ` ${portLabel[dstPort]}` : ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.protocol === "tcp" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {c.protocol.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#6B7280]">{c.tcpState || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[#6B7280]">{formatBytes(c.origBytes)}</td>
                      <td className="py-2.5 px-4 font-mono text-[#6B7280]">{formatBytes(c.respBytes)}</td>
                      <td className="py-2.5 px-4 font-mono text-[#9CA3AF]">{c.timeout}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, description, confirmLabel, confirmClass, loading, error, onConfirm, onCancel }: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmClass: string;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <h3 className="font-bold text-base text-[#1F2937]">{title}</h3>
        <p className="text-xs text-[#6B7280] leading-relaxed">{description}</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all flex items-center gap-2 ${confirmClass}`}
          >
            {loading && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>}
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
