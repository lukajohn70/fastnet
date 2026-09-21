import { useState } from "react";

const LOGS = [
  { time: "08:22:11", type: "api_call", level: "info", event: "GET /rest/ip/hotspot/active — 47 sessions returned" },
  { time: "08:14:22", type: "voucher", level: "info", event: "Voucher issued: user_ab12c · PAY-xkj29a · 1 Hour" },
  { time: "08:02:45", type: "voucher", level: "info", event: "Voucher issued: user_cd34e · PAY-mnz88b · 1 Hour" },
  { time: "07:55:11", type: "payment", level: "info", event: "Paystack callback received · PAY-qrs12c · ₦500 paid" },
  { time: "07:45:03", type: "error", level: "error", event: "MikroTik API timeout (500ms) — retried once, succeeded" },
  { time: "07:21:33", type: "payment", level: "info", event: "Paystack callback received · PAY-abc77d · ₦500 paid" },
  { time: "07:10:08", type: "admin", level: "info", event: "Admin login: admin@192.168.100.12" },
  { time: "06:58:50", type: "payment", level: "warn", event: "Paystack webhook: PAY-fgh99f failed — card declined" },
  { time: "06:30:19", type: "error", level: "error", event: "API 404: endpoint /rest/ip/hotspot/user not found" },
  { time: "06:00:00", type: "system", level: "info", event: "Server started · FastAPI 0.112.0 · Port 8000" },
];

const TYPE_STYLE: Record<string, string> = {
  system: "bg-[#EFF6FF] text-[#1D4ED8]",
  admin: "bg-purple-50 text-purple-600",
  api_call: "bg-gray-100 text-[#6B7280]",
  voucher: "bg-[#ECFDF5] text-[#065F46]",
  payment: "bg-[#FFF7ED] text-[#92400E]",
  error: "bg-red-50 text-red-600",
};

const LEVEL_DOT: Record<string, string> = {
  info: "bg-[#10B981]",
  warn: "bg-[#F97316]",
  error: "bg-red-500",
};

export default function SystemLogs() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = LOGS.filter((l) => {
    const matchType = typeFilter === "all" || l.type === typeFilter;
    const matchSearch = l.event.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] w-52"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="system">System</option>
          <option value="admin">Admin</option>
          <option value="api_call">API Call</option>
          <option value="voucher">Voucher</option>
          <option value="payment">Payment</option>
          <option value="error">Error</option>
        </select>
        <button className="px-4 py-2 text-sm bg-white border border-gray-200 text-[#6B7280] rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M4 8h8M6 12h4" />
          </svg>
          Export
        </button>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-[#F9FAFB] flex items-center justify-between">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Audit Trail</p>
          <span className="text-xs text-[#6B7280]">{filtered.length} entries</span>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((log, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${LEVEL_DOT[log.level]}`} />
              <span className="font-mono text-xs text-[#9CA3AF] flex-shrink-0 mt-0.5 w-16">{log.time}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 ${TYPE_STYLE[log.type]}`}>
                {log.type}
              </span>
              <p className="text-sm text-[#1F2937] flex-1">{log.event}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
