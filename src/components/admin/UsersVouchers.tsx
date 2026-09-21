import { useState } from "react";
import BatchModal from "./BatchModal";

interface User {
  ref: string;
  created: string;
  plan: string;
  comment: string;
  remaining: string;
  lastSeen: string;
  status: string;
  ip?: string;
  mac?: string;
  bytesIn?: string;
  bytesOut?: string;
}

const INITIAL_USERS: User[] = [
  { ref: "user_ab12c", created: "2026-09-10 08:14", plan: "1 Hour", comment: "PAY-xkj29a", remaining: "42 min", lastSeen: "2 min ago", status: "active", ip: "10.12.12.101", mac: "AA:BB:CC:DD:EE:01", bytesIn: "142 MB", bytesOut: "18 MB" },
  { ref: "user_cd34e", created: "2026-09-10 08:02", plan: "1 Hour", comment: "PAY-mnz88b", remaining: "28 min", lastSeen: "5 min ago", status: "active", ip: "10.12.12.102", mac: "AA:BB:CC:DD:EE:02", bytesIn: "88 MB", bytesOut: "9 MB" },
  { ref: "user_ef56g", created: "2026-09-10 07:55", plan: "1 Hour", comment: "PAY-qrs12c", remaining: "Expired", lastSeen: "18 min ago", status: "expired", ip: "—", mac: "AA:BB:CC:DD:EE:03", bytesIn: "210 MB", bytesOut: "24 MB" },
  { ref: "user_gh78i", created: "2026-09-10 07:30", plan: "1 Hour", comment: "Batch #4", remaining: "Pending", lastSeen: "—", status: "pending", ip: "—", mac: "—", bytesIn: "—", bytesOut: "—" },
  { ref: "user_ij90k", created: "2026-09-10 07:21", plan: "1 Hour", comment: "PAY-abc77d", remaining: "12 min", lastSeen: "1 min ago", status: "active", ip: "10.12.12.104", mac: "AA:BB:CC:DD:EE:05", bytesIn: "64 MB", bytesOut: "7 MB" },
  { ref: "user_kl12m", created: "2026-09-10 07:10", plan: "1 Hour", comment: "PAY-def33e", remaining: "Expired", lastSeen: "35 min ago", status: "expired", ip: "—", mac: "AA:BB:CC:DD:EE:06", bytesIn: "195 MB", bytesOut: "21 MB" },
  { ref: "user_mn34o", created: "2026-09-10 06:55", plan: "1 Hour", comment: "Batch #4", remaining: "Pending", lastSeen: "—", status: "pending", ip: "—", mac: "—", bytesIn: "—", bytesOut: "—" },
];

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#ECFDF5] text-[#065F46]",
  expired: "bg-gray-100 text-[#6B7280]",
  pending: "bg-[#FFF7ED] text-[#92400E]",
};

type Modal =
  | { type: "view"; user: User }
  | { type: "kick"; user: User }
  | { type: "delete"; user: User }
  | null;

export default function UsersVouchers() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [batchOpen, setBatchOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  const filtered = users.filter((u) => {
    const matchSearch = u.ref.includes(search) || u.comment.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const kickUser = (ref: string) => {
    setUsers((prev) =>
      prev.map((u) => u.ref === ref ? { ...u, status: "expired", remaining: "Kicked", lastSeen: "just now", ip: "—" } : u)
    );
    setModal(null);
  };

  const deleteUser = (ref: string) => {
    setUsers((prev) => prev.filter((u) => u.ref !== ref));
    setModal(null);
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
            <input type="text" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] w-48"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button onClick={() => setBatchOpen(true)}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-200 transition-all"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Batch Generate
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9FAFB]">
                {["Ref / Username", "Created", "Plan", "Comment", "Time Remaining", "Last Seen", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.ref} className="border-b border-gray-50 hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#1F2937] font-semibold whitespace-nowrap">{u.ref}</td>
                  <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap text-xs">{u.created}</td>
                  <td className="px-4 py-3 text-[#1F2937] whitespace-nowrap">{u.plan}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280] whitespace-nowrap">{u.comment}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold ${u.remaining === "Expired" || u.remaining === "Kicked" ? "text-[#6B7280]" : u.remaining === "Pending" ? "text-[#F97316]" : "text-[#10B981]"}`}>
                      {u.remaining}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap text-xs">{u.lastSeen}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModal({ type: "kick", user: u })}
                        disabled={u.status !== "active"}
                        className="px-2.5 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Kick
                      </button>
                      <button
                        onClick={() => setModal({ type: "view", user: u })}
                        className="px-2.5 py-1.5 text-xs bg-[#EFF6FF] text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", user: u })}
                        className="px-2.5 py-1.5 text-xs bg-gray-50 text-[#6B7280] rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors font-medium"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#6B7280] text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[#6B7280] text-xs">{filtered.length} of {users.length} entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-[#6B7280] hover:bg-gray-50">Prev</button>
            <button className="px-3 py-1.5 text-xs bg-[#2563EB] text-white rounded-lg">1</button>
            <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-[#6B7280] hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {batchOpen && <BatchModal onClose={() => setBatchOpen(false)} />}

      {/* View modal */}
      {modal?.type === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-[#1F2937] font-bold text-base">User Details</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-2.5 text-sm">
              {[
                ["Username", modal.user.ref],
                ["Plan", modal.user.plan],
                ["Created", modal.user.created],
                ["Comment / Ref", modal.user.comment],
                ["Time Remaining", modal.user.remaining],
                ["Last Seen", modal.user.lastSeen],
                ["IP Address", modal.user.ip ?? "—"],
                ["MAC Address", modal.user.mac ?? "—"],
                ["Data In", modal.user.bytesIn ?? "—"],
                ["Data Out", modal.user.bytesOut ?? "—"],
                ["Status", modal.user.status],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                  <span className="text-[#6B7280]">{l}</span>
                  <span className="font-mono text-xs font-semibold text-[#1F2937] bg-gray-50 px-2 py-0.5 rounded-lg max-w-[180px] truncate">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex gap-2">
              {modal.user.status === "active" && (
                <button
                  onClick={() => setModal({ type: "kick", user: modal.user })}
                  className="flex-1 bg-red-50 text-red-500 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-100 transition-all"
                >
                  Kick User
                </button>
              )}
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-[#1F2937] font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick confirm */}
      {modal?.type === "kick" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h2 className="text-[#1F2937] font-bold text-lg text-center">Disconnect User?</h2>
            <p className="text-[#6B7280] text-sm text-center mt-2 mb-5">
              <span className="font-mono font-semibold text-[#1F2937]">{modal.user.ref}</span> will be disconnected from the hotspot immediately.
            </p>
            <div className="flex gap-3">
              <button onClick={() => kickUser(modal.user.ref)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all">
                Yes, Kick
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-[#6B7280] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className="text-[#1F2937] font-bold text-lg text-center">Delete User?</h2>
            <p className="text-[#6B7280] text-sm text-center mt-2 mb-5">
              <span className="font-mono font-semibold text-[#1F2937]">{modal.user.ref}</span> will be permanently removed from the system.
            </p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser(modal.user.ref)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all">
                Delete
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-[#6B7280] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
