"use client";

import { useEffect, useState } from "react";
import { addAuditLog, makeId, readDemoDatabase, updateDemoDatabase } from "@/lib/demo-store";
import type { Room } from "@/types";

export default function ImportClient() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRooms(readDemoDatabase().rooms.filter((room) => room.status !== "inactive"));
  }, []);

  // Build maps: room name (lower) → id, and number-only → id
  const nameToId: Record<string, string> = {};
  const numToId: Record<string, string> = {};
  rooms.forEach((r) => {
    nameToId[r.name.trim().toLowerCase()] = r.id;
    const m = r.name.match(/\d+/);
    if (m) numToId[m[0]] = r.id;
  });

  function resolveRoom(raw: string): string | null {
    const key = raw.trim().toLowerCase();
    if (nameToId[key]) return nameToId[key];
    const numOnly = raw.replace(/[^0-9]/g, "");
    if (numOnly && numToId[numOnly]) return numToId[numOnly];
    const suffix = " " + key;
    const match = Object.keys(nameToId).find(
      (k) => k.length > suffix.length && k.slice(k.length - suffix.length) === suffix
    );
    return match ? nameToId[match] : null;
  }

  async function handleImport() {
    setLog([]);
    setRunning(true);
    const lines = text.trim().split("\n").filter((l) => l.trim());
    const out: string[] = [];

    const toInsert: object[] = [];
    const skipped: string[] = [];

    lines.forEach((line, i) => {
      // tab-separated: room_no \t guest_name \t check_in \t check_out
      const parts = line.split("\t").map((p) => p.trim());
      if (parts.length < 4) { skipped.push("Line " + (i + 1) + ": not enough columns"); return; }
      const [roomRaw, guestName, checkIn, checkOut] = parts;
      if (!roomRaw || !guestName || !checkIn || !checkOut) { skipped.push("Line " + (i + 1) + ": blank required field"); return; }
      const roomId = resolveRoom(roomRaw);
      if (!roomId) { skipped.push("Line " + (i + 1) + ": room '" + roomRaw + "' not found"); return; }
      if (checkOut <= checkIn) { skipped.push("Line " + (i + 1) + ": checkout before checkin"); return; }
      toInsert.push({ room_id: roomId, guest_name: guestName, check_in: checkIn, check_out: checkOut, num_guests: 1, payment_status: "pending" });
    });

    out.push("Parsed " + toInsert.length + " reservations, skipped " + skipped.length + " lines.");
    setLog([...out]);

    updateDemoDatabase((db) => {
      toInsert.forEach((item) => {
        const reservation = item as { room_id: string; guest_name: string; check_in: string; check_out: string; num_guests: number; payment_status: "pending" };
        const id = makeId("reservation");
        db.reservations.push({ ...reservation, id, guest_phone: null, notes: null, created_at: new Date().toISOString() });
        addAuditLog(db, "reservation.create", "reservation", id, { guest_name: reservation.guest_name, source: "import" });
      });
    });
    const inserted = toInsert.length;
    out.push("Saved " + inserted + " reservations to this browser.");

    if (skipped.length > 0) out.push("", "Skipped lines:", ...skipped.slice(0, 30));
    out.push("", "Done. " + inserted + " reservations imported.");
    setLog([...out]);
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h1 className="text-xl font-bold text-slate-800">Import Reservations</h1>
          <p className="text-sm text-slate-500">
            Paste the data from the <strong>IMPORT_DATA</strong> tab of your Google Sheet below.
            Each row: <code className="bg-slate-100 px-1 rounded">room_no [tab] guest_name [tab] check_in [tab] check_out</code>
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <strong>Rooms loaded:</strong> {rooms.length} rooms
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"116\tJohn Smith\t2026-06-01\t2026-06-03\n117\tJane Doe\t2026-06-05\t2026-06-08"}
            rows={12}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />

          <button
            onClick={handleImport}
            disabled={running || !text.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {running ? "Importing..." : "Import"}
          </button>
        </div>

        {log.length > 0 && (
          <div className="bg-slate-900 text-green-400 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap">
            {log.join("\n")}
          </div>
        )}
      </div>
    </div>
  );
}
