import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const trafficData = [
  { time: "06:00", mbps: 12 },
  { time: "07:00", mbps: 28 },
  { time: "08:00", mbps: 45 },
  { time: "09:00", mbps: 62 },
  { time: "10:00", mbps: 55 },
  { time: "11:00", mbps: 78 },
  { time: "12:00", mbps: 92 },
  { time: "13:00", mbps: 87 },
  { time: "14:00", mbps: 70 },
  { time: "15:00", mbps: 65 },
  { time: "16:00", mbps: 83 },
  { time: "17:00", mbps: 94 },
];

const salesData = [
  { day: "Mon", sales: 15500 },
  { day: "Tue", sales: 22000 },
  { day: "Wed", sales: 18500 },
  { day: "Thu", sales: 31000 },
  { day: "Fri", sales: 27500 },
  { day: "Sat", sales: 42000 },
  { day: "Sun", sales: 38500 },
];

const CARDS = [
  {
    title: "Active Users",
    value: "47",
    sub: "+12 in last hour",
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
    title: "Total Sales Today",
    value: "₦195,000",
    sub: "390 sessions",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10h16M5 6l5-3 5 3M5 14l5 3 5-3" />
      </svg>
    ),
  },
  {
    title: "Active Vouchers",
    value: "183",
    sub: "47 in use · 136 pending",
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
    value: "Online",
    sub: "Starlink · MikroTik",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map(({ title, value, sub, color, bg, icon }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-[#6B7280] text-xs font-medium leading-tight">{title}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, color }}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-[#1F2937] font-extrabold text-xl leading-tight" style={{ color }}>
                {value}
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Traffic chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#1F2937] font-semibold text-sm">Live Network Traffic</h3>
              <p className="text-[#6B7280] text-xs mt-0.5">Today, updated every minute</p>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg">Mbps</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trafficData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{ background: "#1F2937", border: "none", borderRadius: "8px", color: "white", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="mbps" stroke="#2563EB" strokeWidth={2} fill="url(#trafficGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#1F2937] font-semibold text-sm">Weekly Sales</h3>
              <p className="text-[#6B7280] text-xs mt-0.5">Revenue in Naira (₦)</p>
            </div>
            <span className="text-xs font-semibold text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-lg">₦</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={salesData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(v) => [`₦${Number(v ?? 0).toLocaleString()}`, "Sales"]}
                contentStyle={{ background: "#1F2937", border: "none", borderRadius: "8px", color: "white", fontSize: "12px" }}
              />
              <Bar dataKey="sales" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[#1F2937] font-semibold text-sm mb-3">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Starlink Ping", value: "18ms", ok: true },
            { label: "MikroTik API", value: "Online", ok: true },
            { label: "Paystack", value: "Operational", ok: true },
            { label: "Database", value: "Healthy", ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ok ? "bg-[#10B981]" : "bg-red-500"}`} />
              <div>
                <p className="text-[#6B7280] text-xs">{label}</p>
                <p className="text-[#1F2937] font-semibold text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
