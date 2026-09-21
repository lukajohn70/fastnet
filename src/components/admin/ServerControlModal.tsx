import { useState, useEffect } from "react";
import {
  getServerSnapshot,
  startServer,
  stopServer,
  saveServerConfig,
  formatUptime,
  subscribeServerState,
  type ServerStatus,
  type PreflightCheck,
  type ServerConfig,
} from "../../services/serverController";
import {
  generateMikroTikLoginHtml,
  downloadCaptivePortalFile,
} from "../../services/hotspotTemplates";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenLicense?: () => void;
}

export default function ServerControlModal({ isOpen, onClose, onOpenLicense }: Props) {
  const [snapshot, setSnapshot] = useState(() => getServerSnapshot());
  const [config, setConfig] = useState<ServerConfig>(snapshot.config);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showFlyerPreview, setShowFlyerPreview] = useState(false);

  useEffect(() => {
    const unsub = subscribeServerState(() => {
      setSnapshot(getServerSnapshot());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleServer = async () => {
    setErrorMessage(null);
    setLoading(true);

    if (snapshot.status === "running") {
      await stopServer();
      setLoading(false);
    } else {
      const res = await startServer();
      setLoading(false);
      if (!res.ok) {
        setErrorMessage(res.message);
      }
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveServerConfig(config);
    setConfig(updated);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(snapshot.urls.primaryUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isRunning = snapshot.status === "running";
  const isStarting = snapshot.status === "starting" || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">FastNet Local Server</h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isRunning
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : isStarting
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                        : "bg-gray-500/20 text-gray-300 border border-gray-500/40"
                    }`}
                  >
                    {snapshot.status}
                  </span>
                </div>
                <p className="text-blue-200 text-xs mt-0.5">
                  Host captive customer portal & synchronize MikroTik static DNS
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleToggleServer}
              disabled={isStarting}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all self-start sm:self-center ${
                isRunning
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/30"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30"
              }`}
            >
              {isStarting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Pre-Flight Checks...
                </>
              ) : isRunning ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  Stop Server
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                    <path d="M4 4l12 6-12 6V4z" />
                  </svg>
                  Start Server
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold">Failed to start server:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Persistent URL Card (Active State) */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Persistent Connection URL
                </span>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl font-mono font-extrabold text-blue-950 tracking-tight">
                    {snapshot.urls.primaryUrl}
                  </p>
                </div>
                <p className="text-xs text-blue-600/90">
                  Direct LAN IP: <span className="font-mono">{snapshot.urls.fallbackUrl}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyUrl}
                  className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {copiedUrl ? (
                    <>
                      <svg viewBox="0 0 20 20" className="w-4 h-4 text-emerald-600" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="7" y="7" width="10" height="10" rx="2" />
                        <path d="M4 13V5a2 2 0 012-2h8" />
                      </svg>
                      Copy URL
                    </>
                  )}
                </button>

                <a
                  href={snapshot.urls.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M11 3h6m0 0v6m0-6L9 11M5 7H4a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-1" />
                  </svg>
                  Open Portal
                </a>

                <button
                  onClick={() => setShowFlyerPreview(!showFlyerPreview)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                    <rect x="6" y="6" width="3" height="3" />
                    <rect x="11" y="6" width="3" height="3" />
                    <rect x="6" y="11" width="3" height="3" />
                  </svg>
                  {showFlyerPreview ? "Hide Flyer" : "View QR Flyer"}
                </button>
              </div>
            </div>

            {/* Flyer / QR Preview */}
            {showFlyerPreview && (
              <div className="mt-5 p-5 bg-white border border-blue-200 rounded-xl shadow-inner flex flex-col items-center text-center animate-fadeIn">
                <div className="w-40 h-40 bg-white border-4 border-black p-2 rounded-xl flex items-center justify-center relative shadow-md">
                  {/* Clean SVG QR code representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
                    {/* Corner 1 */}
                    <rect x="5" y="5" width="30" height="30" rx="3" />
                    <rect x="10" y="10" width="20" height="20" fill="white" />
                    <rect x="15" y="15" width="10" height="10" />
                    {/* Corner 2 */}
                    <rect x="65" y="5" width="30" height="30" rx="3" />
                    <rect x="70" y="10" width="20" height="20" fill="white" />
                    <rect x="75" y="15" width="10" height="10" />
                    {/* Corner 3 */}
                    <rect x="5" y="65" width="30" height="30" rx="3" />
                    <rect x="10" y="70" width="20" height="20" fill="white" />
                    <rect x="15" y="75" width="10" height="10" />
                    {/* Data Matrix pattern */}
                    <rect x="42" y="10" width="8" height="8" />
                    <rect x="52" y="18" width="6" height="6" />
                    <rect x="42" y="28" width="6" height="6" />
                    <rect x="10" y="45" width="8" height="8" />
                    <rect x="22" y="45" width="6" height="8" />
                    <rect x="34" y="45" width="8" height="8" />
                    <rect x="45" y="45" width="10" height="10" />
                    <rect x="60" y="45" width="8" height="8" />
                    <rect x="72" y="45" width="6" height="6" />
                    <rect x="85" y="45" width="8" height="8" />
                    <rect x="45" y="65" width="8" height="8" />
                    <rect x="58" y="70" width="8" height="8" />
                    <rect x="75" y="65" width="8" height="8" />
                    <rect x="85" y="75" width="8" height="8" />
                    <rect x="48" y="85" width="8" height="8" />
                    <rect x="65" y="85" width="8" height="8" />
                    <rect x="80" y="85" width="8" height="8" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                      FASTNET
                    </span>
                  </div>
                </div>

                <h4 className="font-extrabold text-gray-900 text-base mt-3">Scan to Connect to FastNet Hotspot</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-0.5">
                  Point your smartphone camera at this code or open browser to{" "}
                  <strong className="text-blue-600 font-mono">{snapshot.urls.primaryUrl}</strong>
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow"
                  >
                    🖨️ Print Counter Poster
                  </button>
                  <button
                    onClick={() => {
                      const html = generateMikroTikLoginHtml(config.domain, config.port);
                      downloadCaptivePortalFile("login.html", html);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
                    title="Download login.html to upload into MikroTik Files > hotspot"
                  >
                    📥 Download Router login.html
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pre-Flight Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Pre-Flight Health Verification
              </h4>
              <span className="text-xs text-gray-400">
                {snapshot.checks.filter((c) => c.status === "passed").length} of {snapshot.checks.length || 6} passed
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white overflow-hidden shadow-sm">
              {(snapshot.checks.length > 0 ? snapshot.checks : defaultPendingChecks(config)).map((check) => (
                <div key={check.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {check.status === "passed" && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                      {check.status === "warn" && (
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <span className="font-bold text-[10px]">!</span>
                        </div>
                      )}
                      {check.status === "failed" && (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                      {check.status === "running" && (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      )}
                      {check.status === "pending" && (
                        <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-gray-800">{check.title}</p>
                      <p className="text-gray-500 mt-0.5">{check.description}</p>
                      {check.detail && (
                        <p
                          className={`mt-1 font-mono text-[11px] ${
                            check.status === "failed"
                              ? "text-red-600 font-semibold"
                              : check.status === "warn"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          ↳ {check.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  {check.id === "license" && check.status === "failed" && onOpenLicense && (
                    <button
                      onClick={onOpenLicense}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      Renew License
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Server Live Metrics (when running) */}
          {isRunning && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <p className="text-[11px] text-gray-500 font-medium">Uptime</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{formatUptime(snapshot.metrics.uptimeSeconds)}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <p className="text-[11px] text-gray-500 font-medium">Connected Clients</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{snapshot.metrics.activeClientsCount}</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <p className="text-[11px] text-gray-500 font-medium">Requests Handled</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">{snapshot.metrics.requestsHandled}</p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSaveConfig} className="border-t border-gray-200 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Server & Network Binding Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Persistent Domain
                </label>
                <input
                  type="text"
                  value={config.domain}
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                  placeholder="wazobia.fastnet"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  HTTP Service Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 8080 })}
                  placeholder="8080"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Host LAN IP
                </label>
                <input
                  type="text"
                  value={config.hostIp}
                  onChange={(e) => setConfig({ ...config, hostIp: e.target.value })}
                  placeholder="10.12.12.50"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoStartOnLaunch}
                  onChange={(e) => setConfig({ ...config, autoStartOnLaunch: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">Auto-start FastNet Server on app launch</span>
              </label>

              <button
                type="submit"
                className="px-4 py-1.5 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save Server Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function defaultPendingChecks(cfg: ServerConfig): PreflightCheck[] {
  return [
    {
      id: "license",
      title: "Software License & Trial",
      description: "Verifies active 7-day trial or valid license key",
      status: "pending",
    },
    {
      id: "adapter",
      title: "Network Adapter & Host IP",
      description: `Verifies host network interface on subnet (${cfg.hostIp})`,
      status: "pending",
    },
    {
      id: "port",
      title: "HTTP Service Port",
      description: `Checks port :${cfg.port} availability`,
      status: "pending",
    },
    {
      id: "router",
      title: "MikroTik RouterOS API",
      description: "Authenticates REST API and checks system health",
      status: "pending",
    },
    {
      id: "hotspot",
      title: "Hotspot Server Profile",
      description: "Verifies hotspot server and bridge interface configuration",
      status: "pending",
    },
    {
      id: "dns",
      title: "Persistent DNS Synchronization",
      description: `Provisions ${cfg.domain} -> ${cfg.hostIp} in router static DNS`,
      status: "pending",
    },
  ];
}
