"use client";

import { useState } from "react";
import type { UserRole } from "@/types";
import ManageUsersModal from "./ManageUsersModal";
import ManageRoomsModal from "./ManageRoomsModal";
import AuditLogModal from "./AuditLogModal";

interface Props {
  userRole: UserRole;
  userEmail: string;
  onClose: () => void;
  onDataChanged: () => void;
}

const CHANGELOG = [
  {
    version: "2.0", date: "Nov 2026",
    notes: ["Public portfolio demo with no login", "Browser-local fictional data", "One-click demo reset", "Removed all live database and production API connections"],
  },
  {
    version: "1.3", date: "Jun 2026",
    notes: ["Admin panel with role-based access", "Manage users (add, change role, delete)", "Manage rooms (add, rename, remove)", "Audit log — who did what and when", "View-only role for read-only staff"],
  },
  {
    version: "1.2", date: "Jun 2026",
    notes: ["Month footer navigation tabs", "Google Sheets import page (/import)", "Pinch-to-zoom on phone"],
  },
  {
    version: "1.1", date: "Jun 2026",
    notes: ["Reservation color coding by payment status", "Phone-optimized full-month overview", "Scroll to today on load"],
  },
  {
    version: "1.0", date: "Jun 2026",
    notes: ["Room rack calendar (Gantt view)", "Reservation CRUD — guest, dates, payment, notes", "Original staff authentication workflow"],
  },
];

type View = "menu" | "users" | "rooms" | "audit" | "changelog";

export default function AdminPanel({ userRole, userEmail, onClose, onDataChanged }: Props) {
  const [view, setView] = useState<View>("menu");
  const isAdmin = userRole === "admin";

  if (view === "users") return <ManageUsersModal onClose={() => setView("menu")} />;
  if (view === "rooms") return <ManageRoomsModal onClose={() => { onDataChanged(); setView("menu"); }} />;
  if (view === "audit") return <AuditLogModal onClose={() => setView("menu")} />;

  const roleBadge = {
    admin:     "bg-amber-400 text-amber-900",
    staff:     "bg-blue-500 text-white",
    view_only: "bg-slate-500 text-white",
  }[userRole];

  const roleLabel = { admin: "Admin", staff: "Staff", view_only: "View Only" }[userRole];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white flex-shrink-0">
          <div>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">{userEmail}</p>
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1.5 ${roleBadge}`}>
              {roleLabel}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Menu */}
        <div className={`p-3 overflow-auto ${view === "changelog" ? "flex-1" : ""}`}>

          {view === "menu" && (
            <div className="mx-2 mb-2 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-900">
              This is an unrestricted demo workspace. All management actions are simulated and saved only on this device.
            </div>
          )}

          {isAdmin && view === "menu" && (
            <div className="space-y-1 mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-2 pb-1">Management</p>
              <MenuItem icon="👥" label="Manage Users" sub="Add staff, change roles, delete accounts" onClick={() => setView("users")} />
              <MenuItem icon="🏠" label="Manage Rooms" sub="Add, rename, or remove rooms from the rack" onClick={() => setView("rooms")} />
              <MenuItem icon="📋" label="Audit Log" sub="See who created, edited, or deleted what" onClick={() => setView("audit")} />
            </div>
          )}

          {view === "menu" && (
            <div className="space-y-1">
              {isAdmin && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-2 pb-1">Info</p>}
              <MenuItem icon="📝" label="Version History" sub="What changed in each release" onClick={() => setView("changelog")} />
            </div>
          )}

          {view === "changelog" && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 px-1">
                <button onClick={() => setView("menu")} className="text-blue-600 text-sm">‹ Back</button>
                <span className="text-sm font-semibold text-slate-700">Version History</span>
              </div>
              {CHANGELOG.map(v => (
                <div key={v.version} className="border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">v{v.version}</span>
                    <span className="text-xs text-slate-400">{v.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {v.notes.map((n, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                        <span className="text-slate-300 mt-px">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 text-left transition-colors">
      <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      <span className="text-slate-400 text-lg flex-shrink-0">›</span>
    </button>
  );
}
