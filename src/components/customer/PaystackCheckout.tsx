import { useState } from "react";
import { type Plan } from "../../types";

interface Props {
  plan: Plan;
  onSuccess: () => void;
  onCancel: () => void;
}

type PayMethod = "card" | "transfer" | "ussd";

export default function PaystackCheckout({ plan, onSuccess, onCancel }: Props) {
  const [method, setMethod] = useState<PayMethod>("card");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onSuccess(); }, 2000);
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="bg-[#2563EB] px-6 md:px-10 py-4 flex items-center gap-3">
        <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">Secure Checkout</h1>
          <p className="text-blue-200 text-xs">Wazobia FastNet · Powered by Paystack</p>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-4 md:px-10 py-6 max-w-4xl mx-auto w-full">
        <div className="md:grid md:grid-cols-5 md:gap-8 space-y-4 md:space-y-0">

          {/* Left: payment form (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            {/* Payment method tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">Payment Method</p>
              <div className="flex gap-2">
                {([
                  { id: "card", label: "💳 Card" },
                  { id: "transfer", label: "🏦 Bank Transfer" },
                  { id: "ussd", label: "📱 USSD" },
                ] as { id: PayMethod; label: string }[]).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      method === id
                        ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-200"
                        : "bg-gray-50 text-[#6B7280] border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {method === "card" && (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-col gap-3">
                <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">Card Details</p>
                <input type="text" placeholder="Card number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM / YY" className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]" />
                  <input type="text" placeholder="CVV" className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]" />
                </div>
                <input type="text" placeholder="Cardholder name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]" />
              </div>
            )}

            {method === "transfer" && (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">Bank Transfer Details</p>
                <div className="bg-[#EFF6FF] rounded-xl px-4 py-4 space-y-3">
                  {[["Bank", "Wema Bank"], ["Account Number", "0123456789"], ["Account Name", "Wazobia FastNet"], ["Amount", `₦${plan.price.toLocaleString()}`]].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-center">
                      <span className="text-[#6B7280] text-sm">{l}</span>
                      <span className={`font-semibold text-sm font-mono ${l === "Amount" ? "text-[#2563EB]" : "text-[#1F2937]"}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[#6B7280] text-xs mt-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-3 py-2">
                  ⏱ Transfer this exact amount. Voucher is delivered automatically after confirmation (usually within 2 minutes).
                </p>
              </div>
            )}

            {method === "ussd" && (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">USSD Code</p>
                <div className="bg-[#EFF6FF] rounded-2xl px-6 py-6 text-center">
                  <p className="text-[#2563EB] font-extrabold text-3xl tracking-widest">*737*000*{plan.price}#</p>
                  <p className="text-[#6B7280] text-sm mt-2">Dial this code from your registered phone number</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[#6B7280]">
                  {["GTBank *737#", "Access *901#", "UBA *919#", "Zenith *966#", "First Bank *894#", "Stanbic *909#"].map((b) => (
                    <div key={b} className="bg-gray-50 rounded-lg px-2 py-1.5">{b}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: order summary (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-3">Order Summary</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">{plan.name} Unlimited</span>
                  <span className="text-[#1F2937] font-semibold">₦{plan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="text-[#1F2937]">{plan.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Processing fee</span>
                  <span className="text-[#10B981] font-medium">Free</span>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center">
                <span className="text-[#1F2937] font-bold">Total</span>
                <span className="text-[#2563EB] font-extrabold text-2xl">₦{plan.price.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Processing payment…
                </>
              ) : `Pay ₦${plan.price.toLocaleString()}`}
            </button>

            <button onClick={onCancel} className="w-full text-center text-[#6B7280] text-sm hover:text-[#1F2937] transition-colors py-2">
              ← Back to plans
            </button>

            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280] flex-shrink-0" fill="none">
                <rect x="2" y="5" width="12" height="9" rx="2" stroke="#6B7280" strokeWidth="1.3" />
                <path d="M5 5V4a3 3 0 016 0v1" stroke="#6B7280" strokeWidth="1.3" />
              </svg>
              <p className="text-[#6B7280] text-xs">256-bit SSL encrypted. Secured by Paystack.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
