import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import UsersVouchers from "./UsersVouchers";
import PaymentLogs from "./PaymentLogs";
import RouterSettings from "./RouterSettings";
import SystemLogs from "./SystemLogs";
import PlansManager from "./PlansManager";
import ServerControlModal from "./ServerControlModal";
import LicenseModal from "./LicenseModal";
import { type Plan } from "../../types";
import {
  getServerSnapshot,
  subscribeServerState,
} from "../../services/serverController";
import {
  getLicenseData,
  getRemainingTimeText,
  type LicenseData,
} from "../../services/licensing";

type Section = "dashboard" | "users" | "payments" | "plans" | "router" | "logs";

interface Props {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  onLogout: () => void;
  onExitAdmin: () => void;
}

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" /><rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    id: "users",
    label: "Users & Vouchers",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="6" r="3" /><path d="M2 18c0-3.314 2.686-6 6-6s6 2.686 6 6" /><path d="M15 8l2 2 3-3" /></svg>,
  },
  {
    id: "payments",
    label: "Payment Logs",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="18" height="12" rx="2" /><path d="M1 9h18" /></svg>,
  },
  {
    id: "plans",
    label: "Plans",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="14" rx="2" /><path d="M6 7h8M6 11h5" /></svg>,
  },
  {
    id: "router",
    label: "Router & API",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" /></svg>,
  },
  {
    id: "logs",
    label: "System Logs",
    icon: <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12M4 8h12M4 12h8M4 16h5" /></svg>,
  },
];

export default function AdminShell({ plans, setPlans, onLogout, onExitAdmin }: Props) {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  const [serverSnapshot, setServerSnapshot] = useState(() => getServerSnapshot());
  const [licenseData, setLicenseData] = useState<LicenseData>(() => getLicenseData());

  useEffect(() => {
    const unsub = subscribeServerState(() => {
      setServerSnapshot(getServerSnapshot());
    });
    return unsub;
  }, []);

  const remainingTrialText = getRemainingTimeText(licenseData);

  return (
    <div className="h-full flex bg-[#F3F4F6] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-40 h-full w-60 bg-[#1E3A8A] flex flex-col transition-transform duration-200`}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.4A8 8 0 0117 10.4" /><path d="M5.5 13.2A5 5 0 0114.5 13.2" /><circle cx="10" cy="16" r="1.2" fill="white" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Wazobia FastNet</p>
            <p className="text-blue-300 text-xs">Desktop Host & Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setSection(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                section === id
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {icon}
              {label}
              {id === "plans" && (
                <span className="ml-auto bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
                  {plans.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* License Pill & Actions in Sidebar */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setLicenseModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-blue-100 transition-all"
            title="Manage FastNet Software License"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-amber-300" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>{licenseData.tier === "trial" ? "Trial (7 Days)" : "Pro License"}</span>
            </span>
            <span className="text-[10px] text-amber-300 font-bold">
              {licenseData.tier === "trial" ? remainingTrialText : "Active"}
            </span>
          </button>

          <button
            onClick={() => setServerModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${serverSnapshot.status === "running" ? "bg-emerald-400" : "bg-gray-400"}`} />
            <span>Server Control Hub</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Customer Portal</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3M13 15l4-5-4-5M17 10H7" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <h2 className="text-[#1F2937] font-bold text-base">
              {NAV.find((n) => n.id === section)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Clickable Server Status Pill */}
            <button
              onClick={() => setServerModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
                serverSnapshot.status === "running"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : serverSnapshot.status === "starting"
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              }`}
              title="Click to open Server Control Center"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverSnapshot.status === "running"
                    ? "bg-emerald-500 animate-pulse"
                    : serverSnapshot.status === "starting"
                    ? "bg-amber-500 animate-spin"
                    : "bg-gray-400"
                }`}
              />
              <span className="hidden sm:inline">
                {serverSnapshot.status === "running"
                  ? `Online • ${serverSnapshot.config.domain}:${serverSnapshot.config.port}`
                  : serverSnapshot.status === "starting"
                  ? "Starting Server..."
                  : "Server Offline"}
              </span>
              <span className="sm:hidden">
                {serverSnapshot.status === "running" ? "Server ON" : "Server OFF"}
              </span>
            </button>

            {/* Clickable License Badge */}
            <button
              onClick={() => setLicenseModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold transition-colors"
              title="Manage App License & Subscription"
            >
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-blue-600" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0zm-1 8a1 1 0 112 0v3a1 1 0 11-2 0v-3z" clipRule="evenodd" />
              </svg>
              <span>
                {licenseData.tier === "trial"
                  ? `Trial (${remainingTrialText})`
                  : licenseData.tier === "lifetime"
                  ? "Lifetime License"
                  : "Monthly License"}
              </span>
            </button>

            <button
              onClick={onExitAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Return to Customer Hotspot view"
            >
              <span>← Customer View</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {section === "dashboard" && (
            <Dashboard
              onOpenServerControl={() => setServerModalOpen(true)}
              onOpenLicense={() => setLicenseModalOpen(true)}
            />
          )}
          {section === "users" && <UsersVouchers />}
          {section === "payments" && <PaymentLogs />}
          {section === "plans" && <PlansManager plans={plans} setPlans={setPlans} />}
          {section === "router" && <RouterSettings />}
          {section === "logs" && <SystemLogs />}
        </div>
      </div>

      {/* Modals */}
      <ServerControlModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
        onOpenLicense={() => {
          setServerModalOpen(false);
          setLicenseModalOpen(true);
        }}
      />

      <LicenseModal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        onLicenseUpdated={() => setLicenseData(getLicenseData())}
      />
    </div>
  );
}
