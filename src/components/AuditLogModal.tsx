"use client";

import { useState, useEffect } from "react";
import { readDemoDatabase } from "@/lib/demo-store";
import { format, parseISO } from "date-fns";
import type { AuditLog } from "@/types";

const ACTION_LABEL: Record<string, string> = {
  "reservation.create": "Created reservation",
  "reservation.update": "Updated reservation",
  "reservation.delete": "Deleted reservation",
  "user.create": "Created user",
  "user.delete": "Deleted user",
  "user.role_change": "Changed role",
  "room.create": "Added room",
  "room.update": "Renamed room",
  "room.delete": "Removed room",
};

const ACTION_COLOR: Record<string, string> = {
  "reservation.create": "#22c55e",
  "reservation.update": "#3b82f6",
  "reservation.delete": "#ef4444",
  "user.create": "#a855f7",
  "user.delete": "#ef4444",
  "user.role_change": "#f59e0b",
  "room.create": "#22c55e",
  "room.update": "#3b82f6",
  "room.delete": "#ef4444",
};

export default function AuditLogModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "reservation" | "user" | "room">("all");

  useEffect(() => {
    setLogs(readDemoDatabase().auditLogs.slice(0, 500));
    setLoading(false);
  }, []);

  const visible = filter === "all" ? logs : logs.filter(l => l.action.startsWith(filter));

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">‹</button>
        <h2 className="font-semibold text-sm">Audit Log</h2>
        <span className="text-xs text-slate-400 ml-1">({visible.length})</span>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
        {(["all", "reservation", "user", "room"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:text-slate-700"
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No log entries yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map(log => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: ACTION_COLOR[log.action] ?? "#94a3b8" }}>
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">{log.user_email ?? "—"}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 font-mono break-all">
                        {Object.entries(log.details)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {format(parseISO(log.created_at), "dd MMM HH:mm")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
