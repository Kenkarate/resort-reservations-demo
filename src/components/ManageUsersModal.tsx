"use client";

import { useState, useEffect, useCallback } from "react";
import { addAuditLog, makeId, readDemoDatabase, updateDemoDatabase } from "@/lib/demo-store";
import type { DemoUser, UserRole } from "@/types";

type UserRow = DemoUser;

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  view_only: "View Only",
};

export default function ManageUsersModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setUsers(readDemoDatabase().users);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function changeRole(userId: string, role: UserRole) {
    updateDemoDatabase((db) => {
      const target = db.users.find((user) => user.id === userId);
      db.users = db.users.map((user) => user.id === userId ? { ...user, role } : user);
      addAuditLog(db, "user.role_change", "user", userId, { email: target?.email, role });
    });
    load();
  }

  function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete the simulated user ${email}?`)) return;
    updateDemoDatabase((db) => {
      db.users = db.users.filter((user) => user.id !== userId);
      addAuditLog(db, "user.delete", "user", userId, { email });
    });
    load();
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    if (users.some((user) => user.email.toLowerCase() === newEmail.toLowerCase())) {
      setAdding(false);
      setAddError("That demo email already exists.");
      return;
    }
    updateDemoDatabase((db) => {
      const id = makeId("user");
      db.users.push({ id, email: newEmail, role: newRole, created_at: new Date().toISOString(), last_sign_in: null });
      addAuditLog(db, "user.create", "user", id, { email: newEmail, role: newRole });
    });
    setAdding(false);
    setShowAdd(false); setNewEmail(""); setNewRole("staff");
    load();
  }

  const roleColor: Record<UserRole, string> = {
    admin: "bg-amber-100 text-amber-800",
    staff: "bg-blue-100 text-blue-800",
    view_only: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">‹</button>
        <h2 className="font-semibold text-sm">Manage Users</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="ml-auto text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-medium">
          + Add User
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addUser} className="p-4 bg-slate-50 border-b space-y-3 flex-shrink-0">
          {addError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{addError}</p>}
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
            placeholder="Email address"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="rounded-lg border border-cyan-200 bg-cyan-50 p-2 text-xs text-cyan-800">
            Demo users are sample records only. No account or password is created.
          </p>
          <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="staff">Staff — can create & edit reservations</option>
            <option value="view_only">View Only — read-only access</option>
            <option value="admin">Admin — full access</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
            <button type="submit" disabled={adding}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50">
              {adding ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading users...</div>
        ) : error ? (
          <div className="p-4 text-red-600 text-sm">{error}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u.last_sign_in
                      ? `Last login ${new Date(u.last_sign_in).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}`
                      : "Never logged in"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[u.role as UserRole]}`}>
                  {ROLE_LABELS[u.role as UserRole]}
                </span>
                <select value={u.role}
                  onChange={e => changeRole(u.id, e.target.value as UserRole)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="staff">Staff</option>
                  <option value="view_only">View Only</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => deleteUser(u.id, u.email)}
                  className="text-red-400 hover:text-red-600 text-xl leading-none w-6 flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
