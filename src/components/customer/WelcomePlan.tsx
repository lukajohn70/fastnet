import { useState, useEffect } from "react";
import { type Plan } from "../../types";
import {
  getBrandingConfig,
  subscribeBranding,
  type BrandingConfig,
} from "../../services/branding";

interface Props {
  plans: Plan[];
  selectedPlan: Plan;
  onSelectPlan: (p: Plan) => void;
  onPay: () => void;
  onOpenAdmin: () => void;
}

export default function WelcomePlan({ plans, selectedPlan, onSelectPlan, onPay, onOpenAdmin }: Props) {
  const [logoClicks, setLogoClicks] = useState(0);
  const [branding, setBranding] = useState<BrandingConfig>(() => getBrandingConfig());

  useEffect(() => {
    const unsub = subscribeBranding((cfg) => setBranding(cfg));
    return unsub;
  }, []);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 3) {
      onOpenAdmin();
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 1500);
    }
  };

  const currency = branding.currencySymbol || "₦";
  const lowestPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : 500;

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header
        className="px-6 md:px-10 py-4 flex items-center justify-between text-white transition-colors"
        style={{ backgroundColor: branding.brandColor }}
      >
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none"
          title={branding.businessName}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform overflow-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <WifiIcon />
            )}
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{branding.businessName}</h1>
            <p className="text-white/80 text-xs">{branding.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {branding.wifiSsid && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-medium">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10.4A8 8 0 0117 10.4" /><path d="M5.5 13.2A5 5 0 0114.5 13.2" /><circle cx="10" cy="16" r="1.2" fill="white" />
              </svg>
              <span>{branding.wifiSsid}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-white text-xs font-medium">Network Online</span>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div
        className="px-6 md:px-10 pt-8 pb-14 md:pb-16 text-white transition-colors"
        style={{
          background: `linear-gradient(135deg, ${branding.brandColor} 0%, #0F172A 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-extrabold text-2xl md:text-4xl leading-tight mb-3">
            {branding.headline}
          </h2>
          <p className="text-white/80 text-sm md:text-base max-w-lg">
            {branding.subheadline}
          </p>

          {/* Stats row — desktop only */}
          <div className="hidden md:flex gap-8 mt-6">
            {[
              ["150+ Mbps", "Download speed"],
              ["<25ms", "Low latency"],
              [`${currency}${lowestPrice.toLocaleString()}`, "Starting price"],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-white font-extrabold text-xl">{val}</p>
                <p className="text-white/70 text-xs mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave transition */}
      <div
        style={{
          background: `linear-gradient(135deg, ${branding.brandColor} 0%, #0F172A 100%)`,
        }}
      >
        <svg viewBox="0 0 1440 40" className="w-full block" preserveAspectRatio="none">
          <path d="M0,40 L0,15 Q360,40 720,15 Q1080,-10 1440,15 L1440,40 Z" fill="#F3F4F6" />
        </svg>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-10 py-6 max-w-4xl mx-auto w-full">
        <div className="md:grid md:grid-cols-5 md:gap-8">
          {/* Left: plan selection (3 cols on desktop) */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <h3 className="text-[#1F2937] font-bold text-lg md:text-xl">Choose your access plan</h3>
              <p className="text-[#6B7280] text-xs md:text-sm mt-0.5">Instant activation upon payment completion</p>
            </div>

            {/* Plan cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => {
                const selected = selectedPlan.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className={`relative text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer ${
                      selected
                        ? "border-[#2563EB] bg-white shadow-md shadow-blue-100"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {plan.badge && (
                      <span className={`absolute -top-2.5 left-3 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        plan.badge === "Best value" ? "bg-[#F97316] text-white" : "bg-[#2563EB] text-white"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 mb-2.5 flex items-center justify-center ${
                      selected ? "border-[#2563EB] bg-[#2563EB]" : "border-gray-300 bg-white"
                    }`}>
                      {selected && (
                        <svg viewBox="0 0 8 8" className="w-2 h-2" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <p className={`font-bold text-base md:text-lg leading-tight ${selected ? "text-[#1D4ED8]" : "text-[#1F2937]"}`}>
                      {plan.name}
                    </p>
                    <p className={`font-extrabold text-2xl md:text-3xl mt-1 ${selected ? "text-[#2563EB]" : "text-[#1F2937]"}`}>
                      {currency}{plan.price.toLocaleString()}
                    </p>
                    <p className="text-[#6B7280] text-xs mt-1">{plan.duration} · Unlimited</p>
                  </button>
                );
              })}
            </div>

            {/* How it works — desktop inline */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <h4 className="text-[#1F2937] font-semibold text-sm mb-3">How it works</h4>
              <div className="flex gap-0">
                {[
                  { n: "1", label: "Select plan", sub: "Pick duration & price" },
                  { n: "2", label: "Pay securely", sub: "Card, Transfer, or USSD" },
                  { n: "3", label: "Get voucher", sub: "Instant code delivery" },
                  { n: "4", label: "Browse freely", sub: "Enjoy fast internet" },
                ].map(({ n, label, sub }, i, arr) => (
                  <div key={n} className="flex-1 flex items-start gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2563EB] font-bold text-xs">{n}</span>
                      </div>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: "8px" }} />}
                    </div>
                    <div className="pt-0.5 flex-1">
                      <p className="text-[#1F2937] font-semibold text-xs">{label}</p>
                      <p className="text-[#6B7280] text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: selected plan summary + CTA (2 cols on desktop) */}
          <div className="md:col-span-2 mt-4 md:mt-0 space-y-3">
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="px-5 py-3 text-white transition-colors"
                style={{ backgroundColor: branding.brandColor }}
              >
                <p className="text-white/80 text-xs font-medium">Selected plan</p>
                <p className="text-white font-bold text-base">{selectedPlan.name} Unlimited</p>
              </div>
              <div className="px-5 py-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#6B7280] text-sm">Duration</span>
                  <span className="text-[#1F2937] font-semibold text-sm">{selectedPlan.duration}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#6B7280] text-sm">Data</span>
                  <span className="text-[#1F2937] font-semibold text-sm">Unlimited</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] text-sm">Speed</span>
                  <span className="text-[#1F2937] font-semibold text-sm">Full speed</span>
                </div>
                <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center">
                  <span className="text-[#1F2937] font-bold">Total</span>
                  <span className="font-extrabold text-2xl text-[#2563EB]">
                    {currency}{selectedPlan.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="text-[#6B7280] text-xs font-medium mb-2.5">What's included</p>
              <div className="space-y-2">
                {selectedPlan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-[#1F2937] text-sm">
                    <div className="w-4 h-4 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onPay}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              Pay {currency}{selectedPlan.price.toLocaleString()} — {selectedPlan.name}
            </button>

            {branding.supportPhone && (
              <p className="text-center text-[#6B7280] text-xs">
                Need assistance? Call/WhatsApp: <strong className="text-gray-800">{branding.supportPhone}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 border-t border-gray-200 bg-white mt-4 flex items-center justify-center gap-1 text-[#6B7280] text-xs select-none">
        <span>{branding.businessName} · {branding.tagline}</span>
        <button
          onClick={onOpenAdmin}
          aria-label="Admin Access"
          title=""
          className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-sm focus:outline-none"
        >
          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 opacity-30 hover:opacity-80" fill="currentColor">
            <circle cx="8" cy="8" r="6" />
          </svg>
        </button>
      </footer>
    </div>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.4A8 8 0 0117 10.4" />
      <path d="M5.5 13.2A5 5 0 0114.5 13.2" />
      <circle cx="10" cy="16" r="1.2" fill="white" />
    </svg>
  );
}
