import { useState, useEffect } from "react";
import {
  fetchRouterLogs,
  getAppSystemLogs,
  type RouterLogEntry,
  type AppSystemLog,
} from "../../services/mikrotik";

interface UnifiedLog {
  id: string;
  time: string;
  source: "router" | "app";
  level: "info" | "warn" | "error";
  category: string;
  message: string;
}

const LEVEL_STYLE: Record<string, string> = {
  info: "bg-[#ECFDF5] text-[#065F46]",
  warn: "bg-[#FFF7ED] text-[#92400E]",
  error: "bg-red-50 text-red-600",
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [rLogs, aLogs] = await Promise.all([
        fetchRouterLogs(),
        Promise.resolve(getAppSystemLogs()),
      ]);

      const unified: UnifiedLog[] = [];

      // Add router logs
      rLogs.forEach((l) => {
        let level: UnifiedLog["level"] = "info";
        if (l.topics.includes("error") || l.topics.includes("critical")) level = "error";
        else if (l.topics.includes("warning")) level = "warn";

        unified.push({
          id: `r_${l.id}_${Math.random().toString(36).slice(2, 5)}`,
          time: l.time,
          source: "router",
          level,
          category: l.topics,
          message: l.message,
        });
      });

      // Add app logs
      aLogs.forEach((l) => {
        unified.push({
          id: l.id,
          time: l.time,
          source: "app",
          level: l.level,
          category: l.type,
          message: l.event,
        });
      });

      setLogs(unified);
    } catch (err) {
      console.warn("Failed to load logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchType =
      typeFilter === "all" ||
      l.source === typeFilter ||
      l.level === typeFilter;
    const matchSearch =
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
            </svg>
            <input
              type="text"
              placeholder="Search live logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 w-52"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none"
          >
            <option value="all">All Sources ({logs.length})</option>
            <option value="router">MikroTik RouterOS ({logs.filter(l => l.source === "router").length})</option>
            <option value="app">FastNet App ({logs.filter(l => l.source === "app").length})</option>
            <option value="error">Errors only ({logs.filter(l => l.level === "error").length})</option>
            <option value="warn">Warnings only ({logs.filter(l => l.level === "warn").length})</option>
          </select>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
        >
          <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2563EB]" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
          </svg>
          Refresh Logs
        </button>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#9CA3AF]">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin text-[#2563EB]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,0.2)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Fetching live logs from router and audit trail…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#9CA3AF]">
            No matching log entries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {filtered.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/70 transition-colors">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${LEVEL_STYLE[l.level]}`}>
                  {l.level}
                </span>
                <span className="text-xs font-mono text-[#9CA3AF] flex-shrink-0 mt-0.5">{l.time}</span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex-shrink-0">
                  {l.source === "router" ? "RouterOS" : "App"}: {l.category}
                </span>
                <p className="text-[#1F2937] text-xs flex-1 font-mono break-all">{l.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
