import { useState, useEffect } from "react";
import { getPaymentRecords, type PaymentRecord } from "../../services/mikrotik";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-[#ECFDF5] text-[#065F46]",
  failed: "bg-red-50 text-red-600",
  pending: "bg-[#FFF7ED] text-[#92400E]",
};

export default function PaymentLogs() {
  const [logs, setLogs] = useState<PaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const refreshLogs = () => {
    setLogs(getPaymentRecords());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSearch =
      l.ref.toLowerCase().includes(search.toLowerCase()) ||
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.planName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaid = logs
    .filter((l) => l.status === "paid")
    .reduce((s, l) => s + l.amount, 0);

  // Group sales by plan dynamically
  const planMap = new Map<string, number>();
  logs.filter((l) => l.status === "paid").forEach((l) => {
    planMap.set(l.planName, (planMap.get(l.planName) || 0) + l.amount);
  });
  const salesByPlan = Array.from(planMap.entries()).map(([plan, sales]) => ({ plan, sales }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Collected", value: `₦${totalPaid.toLocaleString()}`, color: "#10B981" },
          { label: "Successful Payments", value: logs.filter((l) => l.status === "paid").length.toString(), color: "#2563EB" },
          { label: "Failed Attempts", value: logs.filter((l) => l.status === "failed").length.toString(), color: "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
            <p className="font-extrabold text-lg" style={{ color }}>{value}</p>
            <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sales by Plan breakdown if payments exist */}
      {salesByPlan.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-[#1F2937] font-semibold text-sm mb-3">Revenue by Hotspot Plan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {salesByPlan.map((p) => (
              <div key={p.plan} className="bg-[#F9FAFB] p-3 rounded-xl">
                <span className="text-xs text-[#6B7280]">{p.plan}</span>
                <p className="text-sm font-bold text-[#1F2937] mt-0.5">₦{p.sales.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
            </svg>
            <input
              type="text"
              placeholder="Search reference / voucher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none"
          >
            <option value="all">All Status ({logs.length})</option>
            <option value="paid">Paid ({logs.filter(l => l.status === "paid").length})</option>
            <option value="failed">Failed ({logs.filter(l => l.status === "failed").length})</option>
            <option value="pending">Pending ({logs.filter(l => l.status === "pending").length})</option>
          </select>
        </div>
        <button
          onClick={refreshLogs}
          className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold">
                <th className="py-3 px-4">Paystack Reference</th>
                <th className="py-3 px-4">Voucher Username</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#9CA3AF]">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-semibold text-gray-600">No transactions recorded</p>
                      <p className="text-xs text-gray-400">
                        Customer payments completed via Paystack will be logged here immediately.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.ref} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#1F2937]">{l.ref}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#2563EB]">{l.username}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{l.planName}</td>
                    <td className="py-3 px-4 font-semibold text-[#1F2937]">₦{l.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">{l.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[l.status]}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
