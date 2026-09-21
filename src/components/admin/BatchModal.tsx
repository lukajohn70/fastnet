import { useState } from "react";

interface Props { onClose: () => void; }

export default function BatchModal({ onClose }: Props) {
  const [plan, setPlan] = useState("1 Hour");
  const [count, setCount] = useState("10");
  const [comment, setComment] = useState("Batch #5");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleGenerate = () => {
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) { clearInterval(interval); setDone(true); }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[#1F2937] font-bold text-lg">Batch Generate Vouchers</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!done ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#1F2937] text-sm font-medium">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                >
                  <option>1 Hour</option>
                  <option>3 Hours</option>
                  <option>24 Hours</option>
                  <option>1 Week</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#1F2937] text-sm font-medium">Number of Vouchers</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min={1}
                  max={500}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#1F2937] text-sm font-medium">Batch Comment</label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                />
              </div>

              {progress > 0 && progress < 100 && (
                <div>
                  <div className="flex justify-between text-xs text-[#6B7280] mb-1.5">
                    <span>Generating vouchers…</span>
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

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleGenerate}
                  disabled={progress > 0}
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Generate & Export
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 border border-gray-200 text-[#6B7280] font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF5] mx-auto flex items-center justify-center">
                <svg viewBox="0 0 28 28" className="w-7 h-7" fill="none">
                  <path d="M5 14l6 6 12-12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[#1F2937] font-bold text-lg">{count} Vouchers Generated!</p>
                <p className="text-[#6B7280] text-sm mt-1">Plan: {plan} · Comment: {comment}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-[#2563EB] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-all text-sm">
                  Download PDF
                </button>
                <button className="flex-1 border border-gray-200 text-[#1F2937] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm">
                  View Script
                </button>
              </div>
              <button onClick={onClose} className="text-[#6B7280] text-sm hover:underline">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
