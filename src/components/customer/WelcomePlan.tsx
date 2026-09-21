import { type Plan } from "../../types";

interface Props {
  plans: Plan[];
  selectedPlan: Plan;
  onSelectPlan: (p: Plan) => void;
  onPay: () => void;
}

export default function WelcomePlan({ plans, selectedPlan, onSelectPlan, onPay }: Props) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="bg-[#2563EB] px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <WifiIcon />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Wazobia FastNet</h1>
            <p className="text-blue-200 text-xs">Powered by Starlink</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-white text-xs font-medium">Network Online</span>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-6 md:px-10 pt-8 pb-14 md:pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-extrabold text-2xl md:text-4xl leading-tight mb-3">
            Fast, Reliable Internet<br className="hidden md:block" /> from Starlink Satellite
          </h2>
          <p className="text-blue-200 text-sm md:text-base max-w-lg">
            Connect in under 2 minutes. Pay securely with Paystack — no registration required.
          </p>
          {/* Stats row — desktop only */}
          <div className="hidden md:flex gap-8 mt-6">
            {[["150+ Mbps", "Download speed"], ["&lt;25ms", "Low latency"], ["₦500", "Starting price"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-white font-extrabold text-xl" dangerouslySetInnerHTML={{ __html: val }} />
                <p className="text-blue-300 text-xs mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1E3A8A]">
        <svg viewBox="0 0 1440 40" className="w-full block" preserveAspectRatio="none">
          <path d="M0,40 L0,15 Q360,40 720,15 Q1080,-10 1440,15 L1440,40 Z" fill="#F3F4F6" />
        </svg>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-10 py-6 max-w-4xl mx-auto w-full">
        <div className="md:grid md:grid-cols-5 md:gap-8">

          {/* Left: plan picker (takes 3 cols on desktop) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-[#1F2937] font-bold text-base">Choose your plan</h3>

            {/* Plan grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const selected = plan.id === selectedPlan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className={`relative text-left rounded-2xl border-2 p-4 md:p-5 transition-all ${
                      selected
                        ? "border-[#2563EB] bg-[#EFF6FF] shadow-lg shadow-blue-100"
                        : "border-gray-200 bg-white hover:border-[#93C5FD] hover:shadow-sm"
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
                      ₦{plan.price.toLocaleString()}
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
              <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 py-3">
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
                  <span className="text-[#2563EB] font-extrabold text-2xl">₦{selectedPlan.price.toLocaleString()}</span>
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
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all"
            >
              Pay ₦{selectedPlan.price.toLocaleString()} — {selectedPlan.name}
            </button>

            <p className="text-center text-[#6B7280] text-xs flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                <rect x="2" y="5" width="12" height="9" rx="2" stroke="#6B7280" strokeWidth="1.3" />
                <path d="M5 5V4a3 3 0 016 0v1" stroke="#6B7280" strokeWidth="1.3" />
              </svg>
              Securely pay with Paystack
            </p>

            {/* Mobile how it works */}
            <div className="md:hidden bg-white rounded-2xl border border-gray-100 px-4 py-4">
              <h4 className="text-[#1F2937] font-semibold text-sm mb-3">How it works</h4>
              <div className="flex gap-3">
                {[{ n: "1", label: "Select plan" }, { n: "2", label: "Pay" }, { n: "3", label: "Get voucher" }, { n: "4", label: "Browse" }].map(({ n, label }) => (
                  <div key={n} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <span className="text-[#2563EB] font-bold text-xs">{n}</span>
                    </div>
                    <span className="text-[#6B7280] text-xs text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 text-center border-t border-gray-200 bg-white mt-4">
        <p className="text-[#6B7280] text-xs">Wazobia FastNet · Powered by Starlink Satellite · Secure payments by Paystack</p>
      </footer>
    </div>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0" />
      <path d="M1.42 9a16 16 0 0121.16 0" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <circle cx="12" cy="20" r="1" fill="white" />
    </svg>
  );
}
