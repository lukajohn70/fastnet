import { useState } from "react";
import CustomerApp from "./components/CustomerApp";
import AdminApp from "./components/AdminApp";
import { PLANS, type Plan } from "./types";

export default function App() {
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [plans, setPlans] = useState<Plan[]>(PLANS);

  return (
    <div className="h-full flex flex-col">
      {/* Mode switcher — demo only */}
      <div className="fixed top-3 right-3 z-50 flex gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1">
        <button
          onClick={() => setMode("customer")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "customer" ? "bg-[#2563EB] text-white shadow" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Customer
        </button>
        <button
          onClick={() => setMode("admin")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "admin" ? "bg-[#2563EB] text-white shadow" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Admin
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "customer" ? (
          <CustomerApp plans={plans} />
        ) : (
          <AdminApp plans={plans} setPlans={setPlans} />
        )}
      </div>
    </div>
  );
}
