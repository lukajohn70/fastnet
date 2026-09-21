import { useState } from "react";
import {
  getLicenseData,
  getMachineId,
  getRemainingTimeText,
  activateLicenseKey,
  generateCryptographicKey,
  resetTrialForTesting,
  simulateExpiredTrialForTesting,
  type LicenseData,
} from "../../services/licensing";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLicenseUpdated?: () => void;
}

export default function LicenseModal({ isOpen, onClose, onLicenseUpdated }: Props) {
  const [license, setLicense] = useState<LicenseData>(() => getLicenseData());
  const [keyInput, setKeyInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const machineId = getMachineId();
  const remainingText = getRemainingTimeText(license);

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const res = await activateLicenseKey(keyInput, nameInput);
    setLoading(false);

    if (res.ok) {
      setLicense(res.data!);
      setStatusMessage({ text: res.message, error: false });
      setKeyInput("");
      onLicenseUpdated?.();
    } else {
      setStatusMessage({ text: res.message, error: true });
    }
  };

  const handleGenerateTestKey = (tier: "monthly" | "lifetime") => {
    const key = generateCryptographicKey(tier, 30, machineId);
    setGeneratedKey(key);
    setKeyInput(key);
  };

  const handleResetTrial = () => {
    const fresh = resetTrialForTesting();
    setLicense(fresh);
    setStatusMessage({ text: "Trial reset to full 7 days.", error: false });
    onLicenseUpdated?.();
  };

  const handleSimulateExpired = () => {
    const expired = simulateExpiredTrialForTesting();
    setLicense(expired);
    setStatusMessage({ text: "Simulated expired trial mode.", error: true });
    onLicenseUpdated?.();
  };

  const getStatusBadge = () => {
    switch (license.status) {
      case "trial_active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            7-Day Trial Active ({remainingText})
          </span>
        );
      case "active_lifetime":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Lifetime License Active
          </span>
        );
      case "active_monthly":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            Monthly Pro Active ({remainingText})
          </span>
        );
      case "trial_expired":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            License Expired
          </span>
        );
      case "tampered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            System Clock Error (Tamper Detected)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">FastNet Software License</h3>
              <p className="text-blue-100 text-xs mt-0.5">Manage operator subscription, trial & hardware binding</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current License State</p>
              <div className="mt-1 flex items-center gap-2">
                {getStatusBadge()}
              </div>
            </div>
            {license.licensedTo && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Licensed To</p>
                <p className="text-xs font-bold text-gray-800">{license.licensedTo}</p>
              </div>
            )}
          </div>

          {/* Machine Hardware ID */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900">Your Machine Hardware ID (HWID)</p>
                <p className="text-xs text-blue-600 mt-0.5">Send this ID to support or the distributor to receive your license key</p>
              </div>
              <button
                onClick={handleCopyHwid}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {copiedHwid ? "Copied!" : "Copy HWID"}
              </button>
            </div>
            <div className="mt-2.5 font-mono text-xs font-bold text-blue-950 bg-white border border-blue-200/80 px-3 py-2 rounded-lg select-all">
              {machineId}
            </div>
          </div>

          {/* Key Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Enter License Key
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="FN-MTH-XXXX-XXXX-XXXX or FN-LFT-XXXX..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Operator / Business Name (Optional)
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Wazobia Cyber Cafe Ltd."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  statusMessage.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !keyInput.trim()}
              className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Verifying Signature..." : "Activate License Key"}
            </button>
          </form>

          {/* Pricing Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Monthly Plan</span>
                <span className="text-xs font-bold text-blue-600">₦15,000 / mo</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Full hotspot management, unlimited vouchers, monthly updates.</p>
            </div>
            <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/30 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Lifetime One-Off</span>
                <span className="text-xs font-bold text-emerald-600">₦99,000 one-off</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Perpetual license locked to this machine ID, zero recurring fees.</p>
            </div>
          </div>

          {/* Developer / Testing Simulator Accordion */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowDevTools(!showDevTools)}
              className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-800 font-medium py-1"
            >
              <span>Testing & Simulator Tools</span>
              <span>{showDevTools ? "▲ Hide" : "▼ Show"}</span>
            </button>

            {showDevTools && (
              <div className="mt-3 p-3 bg-gray-100 rounded-xl space-y-2.5 text-xs">
                <p className="text-[11px] text-gray-500">
                  Generate instant cryptographically-valid test keys signed for your specific Machine ID:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleGenerateTestKey("monthly")}
                    className="py-1.5 px-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-700 font-semibold"
                  >
                    + Generate 30-Day Key
                  </button>
                  <button
                    onClick={() => handleGenerateTestKey("lifetime")}
                    className="py-1.5 px-2 bg-white border border-gray-300 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 font-semibold"
                  >
                    + Generate Lifetime Key
                  </button>
                </div>
                {generatedKey && (
                  <div className="p-2 bg-white rounded border border-blue-200 font-mono text-[10px] break-all text-blue-900 select-all">
                    Generated: {generatedKey}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleResetTrial}
                    className="flex-1 py-1 px-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                  >
                    Reset 7-Day Trial
                  </button>
                  <button
                    onClick={handleSimulateExpired}
                    className="flex-1 py-1 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                  >
                    Simulate Expired
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
