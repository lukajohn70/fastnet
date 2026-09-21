import { useState } from "react";

interface RouterConfig {
  routerIp: string;
  apiPort: string;
  apiUser: string;
  apiPassword: string;
  hotspotProfile: string;
  bridgeInterface: string;
  useSsl: boolean;
}

const API_ERRORS = [
  { time: "08:22:11", code: 401, message: "Unauthorized — check api_worker credentials" },
  { time: "07:45:03", code: 500, message: "Connection timeout to 192.168.88.1" },
  { time: "06:30:19", code: 404, message: "Endpoint /rest/ip/hotspot/user not found" },
];

export default function RouterSettings() {
  const [config, setConfig] = useState<RouterConfig>({
    routerIp: "192.168.88.1",
    apiPort: "443",
    apiUser: "api_worker",
    apiPassword: "",
    hotspotProfile: "hsprof1",
    bridgeInterface: "bridge1",
    useSsl: true,
  });
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePing = () => {
    setPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setPinging(false);
      setPingResult({ ok: true, msg: `✓ Connected to ${config.routerIp}:${config.apiPort} — 18ms` });
    }, 1400);
  };

  const set = (k: keyof RouterConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig((prev) => ({ ...prev, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div className="space-y-5">
      {/* API Config form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-[#F9FAFB] flex items-center justify-between">
          <div>
            <h3 className="text-[#1F2937] font-semibold text-sm">MikroTik API Configuration</h3>
            <p className="text-[#6B7280] text-xs mt-0.5">Connect your router for live user management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-xs text-[#6B7280]">Online</span>
          </div>
        </div>

        <div className="px-5 py-5 grid sm:grid-cols-2 gap-4">
          <Field label="Router IP Address" placeholder="192.168.88.1" value={config.routerIp} onChange={set("routerIp")} />
          <Field label="REST API Port" placeholder="443" value={config.apiPort} onChange={set("apiPort")} />
          <Field label="API Username" placeholder="api_worker" value={config.apiUser} onChange={set("apiUser")} />

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#1F2937] text-xs font-semibold">API Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter API password"
                value={config.apiPassword}
                onChange={set("apiPassword")}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showPassword ? (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 9.5M4.4 4.5A7 7 0 001.5 8s2 4 6.5 4a6.8 6.8 0 003.6-1M7.5 3c3.7.4 5.5 3 5.5 5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1.5 8s2-4.5 6.5-4.5S14.5 8 14.5 8s-2 4.5-6.5 4.5S1.5 8 1.5 8z" />
                    <circle cx="8" cy="8" r="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Field label="Hotspot Profile" placeholder="hsprof1" value={config.hotspotProfile} onChange={set("hotspotProfile")} />
          <Field label="Bridge Interface" placeholder="bridge1" value={config.bridgeInterface} onChange={set("bridgeInterface")} />

          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="ssl"
              checked={config.useSsl}
              onChange={set("useSsl")}
              className="w-4 h-4 rounded accent-[#2563EB]"
            />
            <label htmlFor="ssl" className="text-[#1F2937] text-sm font-medium">
              Use HTTPS / SSL (www-ssl service)
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M13 5L6.5 11.5 3 8" />
            </svg>
            Save Configuration
          </button>
          {saved && (
            <span className="text-[#10B981] text-sm font-medium bg-[#ECFDF5] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" className="w-3.5 h-3.5" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved!
            </span>
          )}
        </div>
      </form>

      {/* Ping test */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[#1F2937] font-semibold text-sm mb-3">API Connectivity Test</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePing}
            disabled={pinging}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            {pinging ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Pinging {config.routerIp}…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
                </svg>
                Test Connection
              </>
            )}
          </button>
          {pingResult && (
            <span className={`text-sm font-medium px-3 py-1.5 rounded-xl ${pingResult.ok ? "text-[#10B981] bg-[#ECFDF5]" : "text-red-500 bg-red-50"}`}>
              {pingResult.msg}
            </span>
          )}
        </div>
      </div>

      {/* Starlink read-only status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[#1F2937] font-semibold text-sm mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          Starlink Status (live)
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "WAN IP", value: "197.242.xx.xx" },
            { label: "Latency", value: "18ms" },
            { label: "Uptime", value: "14d 6h 22m" },
            { label: "Download", value: "148 Mbps" },
            { label: "Upload", value: "22 Mbps" },
            { label: "Dish Status", value: "Connected" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F9FAFB] rounded-xl px-4 py-3">
              <p className="text-[#6B7280] text-xs">{label}</p>
              <p className="text-[#10B981] font-semibold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error logs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[#1F2937] font-semibold text-sm mb-3">Recent API Errors</h3>
        <div className="space-y-2">
          {API_ERRORS.map((e) => (
            <div key={e.time} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-lg flex-shrink-0">{e.code}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[#1F2937] text-sm font-medium">{e.message}</p>
                <p className="text-[#9CA3AF] text-xs mt-0.5 font-mono">{e.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#1F2937] text-xs font-semibold">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
      />
    </div>
  );
}
