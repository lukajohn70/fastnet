import { useState } from "react";

interface Props {
  voucher: { username: string; password: string };
}

export default function MikroTikLogin({ voucher }: Props) {
  const [username, setUsername] = useState(voucher.username);
  const [password, setPassword] = useState(voucher.password);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };

  return (
    <div className="min-h-full flex flex-col bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-[#2563EB] px-6 md:px-10 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0114.08 0" />
            <path d="M1.42 9a16 16 0 0121.16 0" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <circle cx="12" cy="20" r="1" fill="white" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Wazobia FastNet Hotspot</h1>
          <p className="text-blue-200 text-xs">Hotspot Login · 10.12.12.1</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {done ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto">
                <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                  <path d="M8 20l8 8 16-16" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-[#1F2937] font-bold text-2xl">You're Connected!</h2>
                <p className="text-[#6B7280] text-sm mt-2">Enjoy your Starlink-powered internet access.</p>
              </div>
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl px-5 py-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">User</span>
                  <span className="text-[#1F2937] font-mono font-semibold">{username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Session</span>
                  <span className="text-[#10B981] font-semibold">Active · 1 Hour</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Gateway</span>
                  <span className="text-[#1F2937] font-mono text-xs">10.12.12.1</span>
                </div>
              </div>
              <p className="text-[#6B7280] text-xs">Your browser will redirect to your requested page automatically.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-5 text-center">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Hotspot Authentication</p>
                <p className="text-white font-bold text-lg mt-1">Enter your voucher credentials</p>
              </div>

              <form onSubmit={handleLogin} className="px-6 py-6 flex flex-col gap-4">
                <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 text-sm text-[#92400E]">
                  Credentials are pre-filled from your voucher. Just tap Login.
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-sm font-semibold">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-sm font-semibold">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Connecting…
                    </>
                  ) : "LOGIN"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer className="px-6 py-4 text-center border-t border-gray-200 bg-white">
        <p className="text-[#6B7280] text-xs">Wazobia FastNet · Hotspot gateway · 10.12.12.1</p>
      </footer>
    </div>
  );
}
