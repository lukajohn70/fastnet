import { useState, useEffect } from "react";
import CustomerApp from "./components/CustomerApp";
import AdminApp from "./components/AdminApp";
import { PLANS, type Plan } from "./types";

const PLANS_STORAGE_KEY = "fastnet_custom_plans";

export default function App() {
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const [plans, setPlans] = useState<Plan[]>(() => {
    try {
      const saved = localStorage.getItem(PLANS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return PLANS;
  });

  const handleUpdatePlans: React.Dispatch<React.SetStateAction<Plan[]>> = (valOrUpdater) => {
    setPlans((prev) => {
      const next = typeof valOrUpdater === "function" ? valOrUpdater(prev) : valOrUpdater;
      try {
        localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Secret keyboard shortcut: Ctrl+Shift+A or Alt+A to toggle admin mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) ||
          (e.altKey && (e.key === "A" || e.key === "a"))) {
        e.preventDefault();
        setMode((current) => (current === "admin" ? "customer" : "admin"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        {mode === "customer" ? (
          <CustomerApp plans={plans} onOpenAdmin={() => setMode("admin")} />
        ) : (
          <AdminApp
            plans={plans}
            setPlans={handleUpdatePlans}
            onExitAdmin={() => setMode("customer")}
          />
        )}
      </div>
    </div>
  );
}
