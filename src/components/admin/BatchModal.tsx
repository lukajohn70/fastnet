import { useState } from "react";
import { createHotspotUser, generateVoucherCode, getRouterConfig } from "../../services/mikrotik";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BatchModal({ onClose, onSuccess }: Props) {
  const [profile, setProfile] = useState("default");
  const [count, setCount] = useState("5");
  const [comment, setComment] = useState("Batch-A");
  const [duration, setDuration] = useState("1h");
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<{ name: string; password: string }[]>([]);
  const [scriptText, setScriptText] = useState("");
  const [showScript, setShowScript] = useState(false);

  const handleGenerate = async () => {
    const total = Math.min(Math.max(1, parseInt(count) || 1), 100);
    setGenerating(true);
    setProgress(0);

    const vouchers: { name: string; password: string }[] = [];
    const scriptLines: string[] = [
      `# MikroTik RouterOS Script: Generated on ${new Date().toISOString()}`,
      `# Profile: ${profile} | Uptime limit: ${duration} | Comment: ${comment}`,
    ];

    const cfg = getRouterConfig();
    const actualProfile = profile === "default" ? (cfg.hotspotProfile || "default") : profile;

    for (let i = 0; i < total; i++) {
      const uName = generateVoucherCode("v");
      const uPwd = generateVoucherCode("p").replace("p_", "");
      vouchers.push({ name: uName, password: uPwd });

      scriptLines.push(
        `/ip hotspot user add name="${uName}" password="${uPwd}" profile="${actualProfile}" limit-uptime="${duration}" comment="${comment}"`
      );

      // Provision directly on router if connected
      try {
        await createHotspotUser({
          name: uName,
          password: uPwd,
          profile: actualProfile,
          comment,
          limitUptime: duration,
        });
      } catch (e) {
        console.warn(`Could not provision voucher ${uName} directly:`, e);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setScriptText(scriptLines.join("\n"));
    setGeneratedList(vouchers);
    setGenerating(false);
    if (onSuccess) onSuccess();
  };

  const handleDownloadRsc = () => {
    const blob = new Blob([scriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers_${comment.replace(/\s+/g, "_")}.rsc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvContent = "Username,Password,Profile,Duration,Comment\n" +
      generatedList.map((v) => `${v.name},${v.password},${profile},${duration},${comment}`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers_${comment.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[#1F2937] font-bold text-lg">Batch Generate Router Vouchers</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {generatedList.length === 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-xs font-semibold">Hotspot Profile</label>
                  <input
                    type="text"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    placeholder="default"
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-xs font-semibold">Duration (Uptime Limit)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  >
                    <option value="1h">1 Hour (1h)</option>
                    <option value="3h">3 Hours (3h)</option>
                    <option value="24h">24 Hours (1d)</option>
                    <option value="168h">1 Week (7d)</option>
                    <option value="720h">1 Month (30d)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-xs font-semibold">Quantity to Generate</label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min={1}
                    max={100}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#1F2937] text-xs font-semibold">Batch Comment / Tag</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {generating && (
                <div>
                  <div className="flex justify-between text-xs text-[#6B7280] mb-1.5">
                    <span>Provisioning to MikroTik RouterOS…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 text-sm"
                >
                  {generating ? "Provisioning…" : `Generate ${count} Vouchers`}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 border border-gray-200 text-[#6B7280] font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-[#ECFDF5] mx-auto flex items-center justify-center mb-2">
                  <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
                    <path d="M5 14l6 6 12-12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[#1F2937] font-bold text-base">{generatedList.length} Vouchers Created</h3>
                <p className="text-[#6B7280] text-xs mt-0.5">Duration: {duration} · Tag: {comment}</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-3 max-h-40 overflow-y-auto border border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {generatedList.map((v) => (
                    <div key={v.name} className="bg-white p-2 rounded border border-gray-100">
                      <span className="text-[#2563EB] font-bold">{v.name}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-700">{v.password}</span>
                    </div>
                  ))}
                </div>
              </div>

              {showScript ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#1F2937]">RouterOS Terminal Script (.rsc):</p>
                  <textarea
                    readOnly
                    value={scriptText}
                    rows={4}
                    className="w-full text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadCsv}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  Download CSV
                </button>
                <button
                  onClick={handleDownloadRsc}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  Download Router .rsc
                </button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setShowScript((v) => !v)}
                  className="text-[#2563EB] text-xs hover:underline"
                >
                  {showScript ? "Hide Script" : "View RouterOS Script"}
                </button>
                <button
                  onClick={onClose}
                  className="text-[#6B7280] text-xs hover:underline font-medium"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
