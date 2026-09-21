import { useState, useEffect } from "react";
import {
  getBrandingConfig,
  saveBrandingConfig,
  resetBrandingToDefault,
  type BrandingConfig,
} from "../../services/branding";

const PRESET_COLORS = [
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Deep Indigo", hex: "#4F46E5" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Crimson", hex: "#E11D48" },
  { name: "Sunset Orange", hex: "#EA580C" },
  { name: "Midnight Teal", hex: "#0D9488" },
  { name: "Dark Slate", hex: "#0F172A" },
];

export default function BrandingManager() {
  const [config, setConfig] = useState<BrandingConfig>(getBrandingConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getBrandingConfig());
  }, []);

  const handleChange = <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      handleChange("logoUrl", result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBrandingConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm("Reset all branding settings to default Wazobia FastNet configuration?")) {
      const def = resetBrandingToDefault();
      setConfig(def);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[#1F2937] font-bold text-lg">Branding & White-Label Customization</h2>
          <p className="text-[#6B7280] text-xs">
            Customize the logo, business name, Wi-Fi SSID, support contacts, and customer portal appearance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            {saved ? "✓ Saved Changes" : "Save Branding"}
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Live Customer Portal Preview
          </span>
          <span className="text-[11px] text-gray-500">Real-time preview of header & banner</span>
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
          {/* Mini Header Preview */}
          <div
            className="px-5 py-3.5 flex items-center justify-between text-white transition-colors"
            style={{ backgroundColor: config.brandColor }}
          >
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-contain bg-white/20 p-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10.4A8 8 0 0117 10.4" /><path d="M5.5 13.2A5 5 0 0114.5 13.2" /><circle cx="10" cy="16" r="1.2" fill="white" />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-bold text-sm leading-tight">{config.businessName || "Your Business Name"}</p>
                <p className="text-[11px] text-white/80">{config.tagline || "Your Hotspot Tagline"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-white/15 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Wi-Fi: {config.wifiSsid}</span>
              </span>
            </div>
          </div>

          {/* Mini Banner Preview */}
          <div
            className="p-6 text-white text-center sm:text-left transition-colors relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${config.brandColor} 0%, #0F172A 100%)`,
            }}
          >
            <h3 className="font-extrabold text-lg sm:text-xl leading-tight max-w-lg">
              {config.headline || "Fast, Reliable Internet"}
            </h3>
            <p className="text-white/80 text-xs mt-1.5 max-w-md">
              {config.subheadline || "Connect your device and purchase a voucher."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/15 px-2.5 py-1 rounded-lg">
                Currency: <strong className="font-mono">{config.currencySymbol} ({config.currencyCode})</strong>
              </span>
              <span className="bg-white/15 px-2.5 py-1 rounded-lg">
                Support: <strong>{config.supportPhone}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="font-bold text-sm text-[#1F2937]">Business Identity & Logo</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Business / Brand Name
            </label>
            <input
              type="text"
              value={config.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="e.g. Starlink Cafe & Lounge"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={config.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="e.g. High-Speed Satellite Internet"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Logo Upload / URL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Custom Logo
            </label>
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <div className="relative w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-1 flex-shrink-0">
                  <img src={config.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleChange("logoUrl", "")}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow hover:bg-red-700"
                    title="Remove custom logo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <label className="inline-block px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                  <span>Browse Logo Image...</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-gray-400">Recommended: PNG or SVG with transparent background (Max 2MB)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Wi-Fi & Support Contacts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">2</span>
            <h3 className="font-bold text-sm text-[#1F2937]">Wi-Fi Network & Support Contacts</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Wi-Fi SSID (Network Name)
            </label>
            <input
              type="text"
              value={config.wifiSsid}
              onChange={(e) => handleChange("wifiSsid", e.target.value)}
              placeholder="e.g. Starlink_Guest_WiFi"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Displayed on vouchers and captive portal so customers know which Wi-Fi to join.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Support Phone / WhatsApp
              </label>
              <input
                type="text"
                value={config.supportPhone}
                onChange={(e) => handleChange("supportPhone", e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                placeholder="info@mycafe.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Location / Desk Address
            </label>
            <input
              type="text"
              value={config.locationAddress}
              onChange={(e) => handleChange("locationAddress", e.target.value)}
              placeholder="e.g. Reception Desk, Main Building"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Section 3: Portal Content & Currency */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
            <h3 className="font-bold text-sm text-[#1F2937]">Portal Messages & Currency</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Customer Portal Headline
            </label>
            <input
              type="text"
              value={config.headline}
              onChange={(e) => handleChange("headline", e.target.value)}
              placeholder="Fast, Reliable Internet from Starlink Satellite"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Subtitle / Instructions
            </label>
            <textarea
              rows={2}
              value={config.subheadline}
              onChange={(e) => handleChange("subheadline", e.target.value)}
              placeholder="Connect in under 2 minutes. Pay securely with Paystack."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={config.currencySymbol}
                onChange={(e) => handleChange("currencySymbol", e.target.value)}
                placeholder="₦, $, €, £, KES"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-center font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Currency Code
              </label>
              <input
                type="text"
                value={config.currencyCode}
                onChange={(e) => handleChange("currencyCode", e.target.value)}
                placeholder="NGN, USD, GHS"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-center uppercase font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Brand Theme Colors */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold">4</span>
            <h3 className="font-bold text-sm text-[#1F2937]">Theme & Color Scheme</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.brandColor}
                onChange={(e) => handleChange("brandColor", e.target.value)}
                className="w-12 h-10 rounded-xl border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={config.brandColor}
                onChange={(e) => handleChange("brandColor", e.target.value)}
                placeholder="#2563EB"
                className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Presets */}
            <div className="mt-3">
              <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Quick Preset Palettes:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleChange("brandColor", c.hex)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium hover:border-gray-400 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Accent Success Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                className="w-12 h-10 rounded-xl border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => handleChange("accentColor", e.target.value)}
                placeholder="#10B981"
                className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Changes apply immediately to customer portal, receipts, and admin headers.
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            {saved ? "✓ Saved Changes" : "Save All Branding"}
          </button>
        </div>
      </form>
    </div>
  );
}
