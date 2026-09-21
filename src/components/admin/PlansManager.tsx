import { useState } from "react";
import { type Plan } from "../../types";

interface Props {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
}

const EMPTY_PLAN: Omit<Plan, "id"> = {
  name: "",
  duration: "",
  price: 0,
  badge: "",
  features: ["Unlimited data", "Full speed", "Instant access"],
};

type ModalState =
  | { type: "add" }
  | { type: "edit"; plan: Plan }
  | { type: "delete"; plan: Plan }
  | null;

export default function PlansManager({ plans, setPlans }: Props) {
  const [modal, setModal] = useState<ModalState>(null);

  const handleSave = (data: Omit<Plan, "id">, id?: string) => {
    if (id) {
      setPlans((prev) => prev.map((p) => p.id === id ? { ...data, id } : p));
    } else {
      const newId = `plan_${Date.now()}`;
      setPlans((prev) => [...prev, { ...data, id: newId }]);
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setModal(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1F2937] font-bold text-lg">Hotspot Plans</h2>
          <p className="text-[#6B7280] text-sm mt-0.5">
            These plans appear on the customer payment screen in real time.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add Plan
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card header */}
            <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">{plan.name}</p>
                <p className="text-blue-200 text-xs mt-0.5">{plan.duration} · Unlimited</p>
              </div>
              <div className="text-right">
                <p className="text-white font-extrabold text-2xl">₦{plan.price.toLocaleString()}</p>
                {plan.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    plan.badge === "Best value" ? "bg-[#F97316] text-white" : "bg-white/25 text-white"
                  }`}>
                    {plan.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4">
              <p className="text-[#6B7280] text-xs font-medium mb-2.5 uppercase tracking-wide">Features</p>
              <div className="space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#1F2937]">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#10B981]/15 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <span className="text-[#6B7280] text-xs">Position #{index + 1}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ type: "edit", plan })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setModal({ type: "delete", plan })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  disabled={plans.length <= 1}
                >
                  <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3.5h10M5 3.5V2.5h4v1M5.5 6v4M8.5 6v4M3.5 3.5l.5 8h6l.5-8" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new placeholder */}
        <button
          onClick={() => setModal({ type: "add" })}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all flex flex-col items-center justify-center gap-3 p-8 min-h-[200px] group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
            <svg viewBox="0 0 16 16" className="w-5 h-5 text-[#6B7280] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <span className="text-[#6B7280] group-hover:text-[#2563EB] font-semibold text-sm transition-colors">Add New Plan</span>
        </button>
      </div>

      {/* Add / Edit modal */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <PlanFormModal
          initialData={modal.type === "edit" ? modal.plan : undefined}
          onSave={(data) => handleSave(data, modal.type === "edit" ? modal.plan.id : undefined)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className="text-[#1F2937] font-bold text-lg">Delete Plan?</h2>
            <p className="text-[#6B7280] text-sm mt-2 mb-5">
              The <span className="font-semibold text-[#1F2937]">{modal.plan.name}</span> plan (₦{modal.plan.price.toLocaleString()}) will be removed from the customer screen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(modal.plan.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all">
                Delete
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-[#6B7280] font-medium py-2.5 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FormProps {
  initialData?: Plan;
  onSave: (data: Omit<Plan, "id">) => void;
  onClose: () => void;
}

function PlanFormModal({ initialData, onSave, onClose }: FormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [duration, setDuration] = useState(initialData?.duration ?? "");
  const [price, setPrice] = useState(initialData?.price.toString() ?? "");
  const [badge, setBadge] = useState(initialData?.badge ?? "");
  const [features, setFeatures] = useState<string[]>(
    initialData?.features ?? ["Unlimited data", "Full speed", "Instant access"]
  );
  const [newFeature, setNewFeature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Plan name is required";
    if (!duration.trim()) e.duration = "Duration is required";
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = "Enter a valid price";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ name: name.trim(), duration: duration.trim(), price: Number(price), badge: badge.trim() || undefined, features });
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((f) => [...f, newFeature.trim()]);
    setNewFeature("");
  };

  const removeFeature = (i: number) => setFeatures((f) => f.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[#1F2937] font-bold text-lg">
            {initialData ? "Edit Plan" : "Add New Plan"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#1F2937] text-xs font-semibold">Plan Name *</label>
              <input
                type="text"
                placeholder="e.g. 1 Hour"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#1F2937] text-xs font-semibold">Duration *</label>
              <input
                type="text"
                placeholder="e.g. 1 hour"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`border rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] ${errors.duration ? "border-red-300 bg-red-50" : "border-gray-200"}`}
              />
              {errors.duration && <p className="text-red-500 text-xs">{errors.duration}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#1F2937] text-xs font-semibold">Price (₦) *</label>
              <input
                type="number"
                placeholder="500"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`border rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] ${errors.price ? "border-red-300 bg-red-50" : "border-gray-200"}`}
              />
              {errors.price && <p className="text-red-500 text-xs">{errors.price}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#1F2937] text-xs font-semibold">Badge <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              >
                <option value="">No badge</option>
                <option value="Popular">Popular</option>
                <option value="Best value">Best value</option>
                <option value="New">New</option>
                <option value="Recommended">Recommended</option>
              </select>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2">
            <label className="text-[#1F2937] text-xs font-semibold">Features</label>
            <div className="space-y-1.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10B981]/15 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-[#1F2937]">{f}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a feature…"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-2 bg-[#EFF6FF] text-[#2563EB] rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preview */}
          {name && price && (
            <div className="bg-[#F9FAFB] rounded-xl border border-dashed border-gray-300 px-4 py-3">
              <p className="text-[#6B7280] text-xs font-medium mb-1.5">Preview</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1F2937] font-bold text-sm">{name} Unlimited</p>
                  {duration && <p className="text-[#6B7280] text-xs">{duration}</p>}
                </div>
                <p className="text-[#2563EB] font-extrabold text-lg">₦{Number(price || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 rounded-xl transition-all"
            >
              {initialData ? "Save Changes" : "Create Plan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-gray-200 text-[#6B7280] font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
