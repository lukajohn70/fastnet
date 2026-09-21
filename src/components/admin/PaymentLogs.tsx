import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const LOGS = [
  { ref: "PAY-xkj29a", username: "user_ab12c", plan: "1 Hour", amount: 500, time: "08:14:22", status: "paid" },
  { ref: "PAY-mnz88b", username: "user_cd34e", plan: "1 Hour", amount: 500, time: "08:02:45", status: "paid" },
  { ref: "PAY-qrs12c", username: "user_ef56g", plan: "1 Hour", amount: 500, time: "07:55:11", status: "paid" },
  { ref: "PAY-abc77d", username: "user_ij90k", plan: "1 Hour", amount: 500, time: "07:21:33", status: "paid" },
  { ref: "PAY-def33e", username: "user_kl12m", plan: "1 Hour", amount: 500, time: "07:10:08", status: "paid" },
  { ref: "PAY-fgh99f", username: "user_op23q", plan: "1 Hour", amount: 500, time: "06:58:50", status: "failed" },
  { ref: "PAY-ijk44g", username: "user_rs45t", plan: "1 Hour", amount: 500, time: "06:45:19", status: "paid" },
  { ref: "PAY-lmn55h", username: "user_uv67w", plan: "1 Hour", amount: 500, time: "06:30:02", status: "pending" },
];

const salesByPlan = [
  { plan: "1 Hour", sales: 195000 },
  { plan: "3 Hours", sales: 42000 },
  { plan: "24 Hours", sales: 18000 },
];

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-[#ECFDF5] text-[#065F46]",
  failed: "bg-red-50 text-red-600",
  pending: "bg-[#FFF7ED] text-[#92400E]",
};

export default function PaymentLogs() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const filtered = LOGS.filter((l) => statusFilter === "all" || l.status === statusFilter);
  const totalPaid = filtered.filter((l) => l.status === "paid").reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Collected", value: `₦${totalPaid.toLocaleString()}`, color: "#10B981" },
          { label: "Transactions", value: LOGS.filter((l) => l.status === "paid").length.toString(), color: "#2563EB" },
          { label: "Failed", value: LOGS.filter((l) => l.status === "failed").length.toString(), color: "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
            <p className="font-extrabold text-lg" style={{ color }}>{value}</p>
            <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[#1F2937] font-semibold text-sm mb-4">Sales by Plan Today</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={salesByPlan} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="plan" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              formatter={(v) => [`₦${Number(v ?? 0).toLocaleString()}`, "Revenue"]}
              contentStyle={{ background: "#1F2937", border: "none", borderRadius: "8px", color: "white", fontSize: "12px" }}
            />
            <Bar dataKey="sales" fill="#2563EB" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9FAFB]">
                {["Tx Ref", "Username", "Plan", "Amount", "Time", "Status", "Comment"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.ref} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#2563EB] font-semibold whitespace-nowrap">{l.ref}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1F2937] whitespace-nowrap">{l.username}</td>
                  <td className="px-4 py-3 text-[#1F2937] whitespace-nowrap">{l.plan}</td>
                  <td className="px-4 py-3 font-semibold text-[#1F2937] whitespace-nowrap">₦{l.amount}</td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs whitespace-nowrap">{l.time}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[l.status]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs">Paystack · {l.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
