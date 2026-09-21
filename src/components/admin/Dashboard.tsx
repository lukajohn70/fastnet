import { useState, useEffect } from "react";
import {
  fetchSystemResource,
  fetchActiveSessions,
  fetchHotspotUsers,
  getPaymentRecords,
  type SystemResource,
  type HotspotActiveUser,
  type HotspotUser,
  type PaymentRecord,
} from "../../services/mikrotik";
import {
  getServerSnapshot,
  startServer,
  stopServer,
  subscribeServerState,
  formatUptime,
} from "../../services/serverController";

interface DashboardProps {
  onOpenServerControl?: () => void;
  onOpenLicense?: () => void;
}

export default function Dashboard({ onOpenServerControl, onOpenLicense }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<SystemResource | null>(null);
  const [activeSessions, setActiveSessions] = useState<HotspotActiveUser[]>([]);
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUser[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, sessions, users] = await Promise.all([
        fetchSystemResource(),
        fetchActiveSessions(),
        fetchHotspotUsers(),
      ]);
      setResource(res);
      setActiveSessions(sessions);
      setHotspotUsers(users);
    } catch (err) {
      console.warn("Failed to load dashboard router metrics:", err);
    } finally {
      setPayments(getPaymentRecords());
      setLoading(false);
    }
  };

  const [serverSnapshot, setServerSnapshot] = useState(() => getServerSnapshot());
  const [serverActionLoading, setServerActionLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    const unsubServer = subscribeServerState(() => {
      setServerSnapshot(getServerSnapshot());
    });
    return () => {
      clearInterval(interval);
      unsubServer();
    };
  }, []);

  const handleToggleServer = async () => {
    setServerActionLoading(true);
    if (serverSnapshot.status === "running") {
      await stopServer();
    } else {
      await startServer();
    }
    setServerActionLoading(false);
  };


  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const cards = [
    {
      title: "Active Users",
      value: loading ? "…" : String(activeSessions.length),
      sub: resource ? "Connected to MikroTik hotspot" : "Connect router to view sessions",
      color: "#2563EB",
      bg: "#EFF6FF",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="6" r="3" /><path d="M2 18c0-3.314 2.686-6 6-6s6 2.686 6 6" />
          <circle cx="15" cy="7" r="2" /><path d="M18 16c0-2.21-1.343-4-3-4" />
        </svg>
      ),
    },
    {
      title: "Total Sales",
      value: `₦${totalPaid.toLocaleString()}`,
      sub: `${payments.length} total transactions logged`,
      color: "#10B981",
      bg: "#ECFDF5",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 10h16M5 6l5-3 5 3M5 14l5 3 5-3" />
        </svg>
      ),
    },
    {
      title: "Total Vouchers",
      value: loading ? "…" : String(hotspotUsers.length),
      sub: resource ? `${hotspotUsers.filter(u => !u.disabled).length} active on router` : "Router offline",
      color: "#F97316",
      bg: "#FFF7ED",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="16" height="10" rx="2" /><path d="M7 5V3M13 5V3M7 15v2M13 15v2" />
        </svg>
      ),
    },
    {
      title: "Router Status",
      value: resource ? "Online" : "Offline",
      sub: resource ? `${resource.boardName} (CPU: ${resource.cpuLoad}%)` : "Configure in Router & API",
      color: resource ? "#10B981" : "#EF4444",
      bg: resource ? "#ECFDF5" : "#FEF2F2",
      icon: (
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1F2937] font-bold text-lg">System Dashboard</h2>
          <p className="text-[#6B7280] text-xs">Live MikroTik RouterOS v7 telemetry & network stats</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#1F2937] text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
        >
          <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2563EB]" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
          </svg>
          Refresh Live
        </button>
      </div>

      {/* FastNet Local Server & Persistent URL Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">FastNet LAN Server</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  serverSnapshot.status === "running"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : serverSnapshot.status === "starting" || serverActionLoading
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-white/10 text-gray-300 border border-white/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serverSnapshot.status === "running"
                      ? "bg-emerald-400 animate-pulse"
                      : serverSnapshot.status === "starting" || serverActionLoading
                      ? "bg-amber-400 animate-spin"
                      : "bg-gray-400"
                  }`}
                />
                {serverSnapshot.status === "running" ? "Online" : serverSnapshot.status === "starting" ? "Starting" : "Offline"}
              </span>
              {serverSnapshot.status === "running" && (
                <span className="text-[10px] text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
                  Up {formatUptime(serverSnapshot.metrics.uptimeSeconds)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono font-bold text-sm sm:text-base text-white tracking-tight">
                {serverSnapshot.urls.primaryUrl}
              </p>
              <span className="text-[11px] text-blue-200 hidden sm:inline">• Static DNS Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          <button
            onClick={handleToggleServer}
            disabled={serverActionLoading || serverSnapshot.status === "starting"}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 ${
              serverSnapshot.status === "running"
                ? "bg-red-600/90 hover:bg-red-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {serverActionLoading || serverSnapshot.status === "starting" ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Pre-Flight...
              </>
            ) : serverSnapshot.status === "running" ? (
              <>Stop Server</>
            ) : (
              <>
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                  <path d="M4 4l12 6-12 6V4z" />
                </svg>
                Start Server
              </>
            )}
          </button>

          {onOpenServerControl && (
            <button
              onClick={onOpenServerControl}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5"
            >
              <span>Control Hub</span>
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 7l5 5-5 5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ title, value, sub, color, bg, icon }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-[#6B7280] text-xs font-medium leading-tight">{title}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, color }}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#1F2937] leading-none">{value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live Router & Active Sessions Details */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Active Hotspot Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1F2937] font-semibold text-sm">Active Hotspot Sessions ({activeSessions.length})</h3>
            <span className="text-xs text-[#10B981] font-medium bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
              Live RouterOS
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-[#9CA3AF]">
              <svg viewBox="0 0 24 24" className="w-10 h-10 mb-2 stroke-gray-300" fill="none" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" />
              </svg>
              <p className="text-sm font-medium text-[#6B7280]">No active hotspot users currently</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Users will appear here in real time when they connect</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[#6B7280]">
                    <th className="pb-2 font-semibold">User</th>
                    <th className="pb-2 font-semibold">IP Address</th>
                    <th className="pb-2 font-semibold">Uptime</th>
                    <th className="pb-2 font-semibold text-right">Traffic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeSessions.slice(0, 6).map((s) => (
                    <tr key={s.id} className="text-[#1F2937]">
                      <td className="py-2.5 font-mono font-medium">{s.user}</td>
                      <td className="py-2.5 font-mono text-gray-500">{s.address}</td>
                      <td className="py-2.5 text-gray-500">{s.uptime}</td>
                      <td className="py-2.5 text-right font-mono text-gray-500">↓{s.bytesIn} ↑{s.bytesOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live System Diagnostics */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1F2937] font-semibold text-sm">Router Diagnostics</h3>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${resource ? "text-[#10B981] bg-[#ECFDF5]" : "text-red-600 bg-red-50"}`}>
              {resource ? "Connected" : "Disconnected"}
            </span>
          </div>

          {resource ? (
            <div className="space-y-3 my-auto">
              <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                <span className="text-[#6B7280]">Hardware Model</span>
                <span className="font-semibold text-[#1F2937]">{resource.boardName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                <span className="text-[#6B7280]">RouterOS Version</span>
                <span className="font-semibold text-[#1F2937]">{resource.version}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                <span className="text-[#6B7280]">System Uptime</span>
                <span className="font-semibold text-[#1F2937]">{resource.uptime}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                <span className="text-[#6B7280]">CPU Load</span>
                <span className="font-semibold text-[#10B981]">{resource.cpuLoad}%</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-[#6B7280]">Free / Total Memory</span>
                <span className="font-semibold text-[#1F2937]">
                  {Math.round(resource.freeMemory / 1024 / 1024)} MB / {Math.round(resource.totalMemory / 1024 / 1024)} MB
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-[#9CA3AF]">
              <p className="text-sm font-medium text-[#6B7280]">Router not reachable</p>
              <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs">
                Ensure your MikroTik router has REST API enabled (`/ip service enable www-ssl`) and credentials set in Router & API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
