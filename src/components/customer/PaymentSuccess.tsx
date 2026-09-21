import { useState } from "react";
import { type Plan } from "../../types";

interface Props {
  plan: Plan;
  voucher: { username: string; password: string };
  onConnect: () => void;
}

export default function PaymentSuccess({ plan, voucher, onConnect }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Username: ${voucher.username}\nPassword: ${voucher.password}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Success header */}
      <div className="bg-[#10B981] px-6 md:px-10 pt-10 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:gap-8">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 40 40" className="w-9 h-9 md:w-11 md:h-11" fill="none">
                <path d="M7 20l9 9 17-17" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-2xl md:text-3xl">Payment Successful!</h1>
              <p className="text-green-100 text-sm md:text-base mt-1">Your {plan.name} voucher is ready to use</p>
            </div>
          </div>
          {/* Desktop stats */}
          <div className="hidden md:flex gap-8 ml-auto">
            {[["₦" + plan.price.toLocaleString(), "Paid"], [plan.duration, "Access"], ["Instant", "Activation"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-white font-extrabold text-xl">{v}</p>
                <p className="text-green-200 text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="bg-[#10B981]">
        <svg viewBox="0 0 1440 40" className="w-full block" preserveAspectRatio="none">
          <path d="M0,40 L0,15 Q360,40 720,15 Q1080,-10 1440,15 L1440,40 Z" fill="#F3F4F6" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 md:px-10 py-6 max-w-4xl mx-auto w-full">
        <div className="md:grid md:grid-cols-5 md:gap-8 space-y-4 md:space-y-0">

          {/* Left: voucher card (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#10B981] overflow-hidden">
              <div className="bg-[#10B981]/10 px-5 py-3 flex items-center justify-between">
                <span className="text-[#065F46] font-semibold text-sm">Hotspot Voucher — {plan.name}</span>
                <span className="bg-[#10B981] text-white text-xs font-bold px-2.5 py-1 rounded-full">Ready</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="bg-[#F3F4F6] rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[#6B7280] text-xs mb-1">Username</p>
                    <p className="text-[#1F2937] font-bold font-mono text-lg">{voucher.username}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M3 10V4a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="bg-[#F3F4F6] rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[#6B7280] text-xs mb-1">Password</p>
                    <p className="text-[#1F2937] font-bold font-mono text-lg">{voucher.password}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none">
                      <rect x="2" y="5" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={handleCopy}
                  className="w-full border-2 border-[#10B981] text-[#10B981] font-semibold text-sm py-2.5 rounded-xl hover:bg-[#10B981]/5 active:scale-[0.98] transition-all"
                >
                  {copied ? "✓ Copied!" : "Copy Credentials"}
                </button>
              </div>
            </div>

            <p className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 text-[#92400E] text-sm text-center">
              Enter this username and password on the next screen to connect.
            </p>

            <div className="flex gap-3">
              <button className="flex-1 bg-white border border-gray-200 text-[#1F2937] font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2H4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-2" />
                  <rect x="6" y="1" width="8" height="4" rx="1" />
                </svg>
                Print Voucher
              </button>
              <button className="flex-1 bg-[#25D366] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#1DAF56] transition-all flex items-center justify-center gap-2">
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="white">
                  <path d="M10 1.667C5.4 1.667 1.667 5.4 1.667 10c0 1.5.4 2.9 1.1 4.1L1.667 18.333l4.4-1.133A8.267 8.267 0 0010 18.333c4.6 0 8.333-3.733 8.333-8.333S14.6 1.667 10 1.667zm4.6 11.8c-.2.567-1.167 1.067-1.6 1.133-.433.067-.967.1-1.567-.1-.367-.133-.833-.3-1.433-.567-2.5-1.1-4.133-3.633-4.267-3.8-.133-.167-1.1-1.467-1.1-2.8 0-1.333.7-1.983 1-2.267.267-.267.567-.333.767-.333h.567c.167 0 .4-.067.633.467.233.567.8 1.9.867 2.033.067.133.1.3.033.467-.067.167-.1.267-.2.4-.1.133-.233.3-.333.4-.133.133-.267.267-.1.5.167.233.733 1.133 1.567 1.833.7.633 1.433.9 1.633.967.2.067.333.033.467-.067.133-.1.567-.667.733-.9.167-.233.333-.2.567-.1.233.1 1.467.7 1.7.833.233.133.4.2.467.3.067.1.067.567-.133 1.133z" />
                </svg>
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Right: CTA (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
              <h3 className="text-[#1F2937] font-bold text-base mb-1">Ready to browse!</h3>
              <p className="text-[#6B7280] text-sm mb-4">Tap the button below to go to the login page and enter your voucher.</p>
              <button
                onClick={onConnect}
                className="w-full bg-[#10B981] hover:bg-[#059669] active:scale-[0.98] text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-green-200 transition-all"
              >
                Connect to Internet Now
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-3">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">Your session</p>
              {[["Plan", plan.name], ["Duration", plan.duration], ["Data", "Unlimited"], ["Status", "Paid & Active"]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">{l}</span>
                  <span className={`font-semibold ${l === "Status" ? "text-[#10B981]" : "text-[#1F2937]"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
