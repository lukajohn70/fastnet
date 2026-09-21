import { useState } from "react";

interface Props {
  onLogin: () => void;
  onExitAdmin: () => void;
}

export default function AdminLogin({ onLogin, onExitAdmin }: Props) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter your password to continue");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-[#0F2065] via-[#1E3A8A] to-[#2563EB] px-12 xl:px-20 py-12 justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0114.08 0" />
              <path d="M1.42 9a16 16 0 0121.16 0" />
              <path d="M8.53 16.11a6 6 0 016.95 0" />
              <circle cx="12" cy="20" r="1" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-tight">Wazobia FastNet</p>
            <p className="text-blue-300 text-xs">Admin Portal</p>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-white font-extrabold text-4xl xl:text-5xl leading-tight">
              Manage your<br />hotspot network
            </h1>
            <p className="text-blue-200 text-base mt-4 max-w-sm leading-relaxed">
              Monitor active users, process payments, generate vouchers, and control your MikroTik router — all from one dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "📊", title: "Live Dashboard", desc: "Real-time user counts, revenue, and network traffic" },
              { icon: "🎟️", title: "Voucher Management", desc: "Generate, track and revoke hotspot credentials" },
              { icon: "💳", title: "Payment Logs", desc: "Full Paystack transaction history and analytics" },
              { icon: "🔌", title: "Router Control", desc: "MikroTik REST API integration with live status" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-base">
                  {icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-blue-300 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <p className="text-blue-300 text-xs">Live MikroTik RouterOS v7 Integration</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 md:flex-none md:w-[480px] xl:w-[520px] flex flex-col bg-[#F3F4F6]">
        {/* Mobile logo */}
        <div className="md:hidden bg-[#2563EB] px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0114.08 0" />
              <path d="M1.42 9a16 16 0 0121.16 0" />
              <path d="M8.53 16.11a6 6 0 016.95 0" />
              <circle cx="12" cy="20" r="1" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base">Wazobia FastNet Admin</p>
            <p className="text-blue-200 text-xs">Management Dashboard</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-10 xl:px-14 py-10">
          <div className="mb-8">
            <h2 className="text-[#1F2937] font-extrabold text-2xl md:text-3xl">Welcome back</h2>
            <p className="text-[#6B7280] text-sm mt-1.5">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#1F2937] text-sm font-semibold">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#1F2937] text-sm font-semibold">Password</label>
                <button type="button" className="text-[#2563EB] text-xs hover:underline">Forgot password?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] shadow-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm flex items-center gap-2">
                <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full bg-transparent hover:bg-gray-100 text-[#6B7280] font-medium text-sm py-2.5 rounded-xl transition-colors"
            >
              ← Back to Customer Portal
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-[#6B7280] text-xs text-center">
              🔒 Access restricted to local network (192.168.100.x)
            </p>
            <p className="text-[#6B7280] text-xs text-center mt-1.5">
              Wazobia FastNet Admin · v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
