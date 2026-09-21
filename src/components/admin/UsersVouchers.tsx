import { useState, useEffect } from "react";
import BatchModal from "./BatchModal";
import {
  fetchHotspotUsers,
  fetchActiveSessions,
  deleteHotspotUser,
  kickActiveSession,
  type HotspotUser,
  type HotspotActiveUser,
} from "../../services/mikrotik";

export interface DisplayUser {
  id: string;
  name: string;
  profile: string;
  comment: string;
  limitUptime: string;
  status: "active" | "offline" | "disabled";
  ip?: string;
  mac?: string;
  uptime?: string;
  bytesIn?: string;
  bytesOut?: string;
  activeId?: string;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#ECFDF5] text-[#065F46]",
  offline: "bg-gray-100 text-[#6B7280]",
  disabled: "bg-red-50 text-red-600",
};

type Modal =
  | { type: "view"; user: DisplayUser }
  | { type: "kick"; user: DisplayUser }
  | { type: "delete"; user: DisplayUser }
  | null;

export default function UsersVouchers() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [batchOpen, setBatchOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [hUsers, aSessions] = await Promise.all([
        fetchHotspotUsers(),
        fetchActiveSessions(),
      ]);

      const activeMap = new Map<string, HotspotActiveUser>();
      aSessions.forEach((s) => activeMap.set(s.user, s));

      const combined: DisplayUser[] = hUsers.map((u) => {
        const active = activeMap.get(u.name);
        return {
          id: u.id,
          name: u.name,
          profile: u.profile,
          comment: u.comment || "—",
          limitUptime: u.limitUptime || "Unlimited",
          status: u.disabled ? "disabled" : active ? "active" : "offline",
          ip: active?.address || "—",
          mac: active?.macAddress || "—",
          uptime: active?.uptime || "—",
          bytesIn: active?.bytesIn || u.bytesIn || "0 B",
          bytesOut: active?.bytesOut || u.bytesOut || "0 B",
          activeId: active?.id,
        };
      });

      // Also include any active sessions that might not have a formal user object (e.g. trial/bypass)
      aSessions.forEach((s) => {
        if (!hUsers.some((u) => u.name === s.user)) {
          combined.push({
            id: s.id,
            name: s.user,
            profile: "active",
            comment: s.loginBy || "guest",
            limitUptime: "Active Session",
            status: "active",
            ip: s.address,
            mac: s.macAddress,
            uptime: s.uptime,
            bytesIn: s.bytesIn,
            bytesOut: s.bytesOut,
            activeId: s.id,
          });
        }
      });

      setUsers(combined);
    } catch (err) {
      console.warn("Failed to load users from router:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.comment.toLowerCase().includes(search.toLowerCase()) ||
      (u.ip && u.ip.includes(search));
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const handleKick = async (user: DisplayUser) => {
    if (!user.activeId) return;
    setActionLoading(true);
    try {
      await kickActiveSession(user.activeId);
      await loadUsers();
    } catch (e) {
      console.error("Kick failed:", e);
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  const handleDelete = async (user: DisplayUser) => {
    setActionLoading(true);
    try {
      await deleteHotspotUser(user.id);
      await loadUsers();
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
            </svg>
            <input
              type="text"
              placeholder="Search user / IP / tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] w-52"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option value="all">All ({users.length})</option>
            <option value="active">Active ({users.filter(u => u.status === "active").length})</option>
            <option value="offline">Offline ({users.filter(u => u.status === "offline").length})</option>
            <option value="disabled">Disabled ({users.filter(u => u.status === "disabled").length})</option>
          </select>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1.5 transition-colors"
            title="Refresh router users"
          >
            <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2563EB]" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M13.5 8a5.5 5.5 0 11-1.6-3.9l1.6 1.4" /><path d="M13.5 2.5v3h-3" />
            </svg>
            Refresh
          </button>
        </div>
        <button
          onClick={() => setBatchOpen(true)}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-200 transition-all"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          + Batch Generate
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold">
                <th className="py-3 px-4">Username / Voucher</th>
                <th className="py-3 px-4">Profile</th>
                <th className="py-3 px-4">Tag / Comment</th>
                <th className="py-3 px-4">Uptime Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP / MAC</th>
                <th className="py-3 px-4">Traffic</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin text-[#2563EB]" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,0.2)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0110 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Loading vouchers from MikroTik router…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#9CA3AF]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-gray-600">No vouchers found</p>
                      <p className="text-xs text-gray-400">
                        Generate vouchers with "+ Batch Generate" or purchase a plan on the customer portal.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#1F2937]">{u.name}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{u.profile}</td>
                    <td className="py-3 px-4 text-[#6B7280] max-w-[150px] truncate">{u.comment}</td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">{u.limitUptime}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[u.status] || "bg-gray-100 text-gray-600"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                      <div>{u.ip}</div>
                      <div className="text-[10px] text-gray-400">{u.mac}</div>
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                      ↓{u.bytesIn} ↑{u.bytesOut}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status === "active" && (
                          <button
                            onClick={() => setModal({ type: "kick", user: u })}
                            className="text-xs text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg font-medium transition-colors"
                          >
                            Kick
                          </button>
                        )}
                        <button
                          onClick={() => setModal({ type: "delete", user: u })}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {batchOpen && (
        <BatchModal
          onClose={() => setBatchOpen(false)}
          onSuccess={() => {
            loadUsers();
          }}
        />
      )}

      {/* Confirmation / Action Modals */}
      {modal?.type === "kick" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-[#1F2937]">Kick Active User</h3>
            <p className="text-xs text-[#6B7280]">
              Are you sure you want to disconnect session <span className="font-mono font-bold text-gray-800">{modal.user.name}</span> ({modal.user.ip})?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKick(modal.user)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {actionLoading ? "Disconnecting…" : "Kick Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-base text-[#1F2937]">Delete Hotspot Voucher</h3>
            <p className="text-xs text-[#6B7280]">
              Remove voucher <span className="font-mono font-bold text-gray-800">{modal.user.name}</span> permanently from the router?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(modal.user)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {actionLoading ? "Deleting…" : "Delete Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
