"use client";

import { useState, useEffect, useCallback } from "react";
import { addAuditLog, makeId, readDemoDatabase, updateDemoDatabase } from "@/lib/demo-store";

interface RoomRow { id: string; name: string; category_id: string; category_name: string; status: string; }
interface Cat { id: string; name: string; }

export default function ManageRoomsModal({ onClose }: { onClose: () => void }) {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const db = readDemoDatabase();
    setRooms(db.rooms.map((room) => ({ ...room, status: room.status ?? "active" })));
    const catsData: Cat[] = db.categories;
    setCats(catsData);
    if (!newCatId && catsData.length) setNewCatId(catsData[0].id);
    setLoading(false);
  }, [newCatId]);

  useEffect(() => { load(); }, [load]);

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCatId) return;
    updateDemoDatabase((db) => {
      const category = db.categories.find((item) => item.id === newCatId);
      const id = makeId("room");
      db.rooms.push({ id, name: newName.trim(), category_id: newCatId, category_name: category?.name ?? "Other", sort_order: db.rooms.length + 1, status: "active" });
      addAuditLog(db, "room.create", "room", id, { name: newName.trim() });
    });
    setNewName(""); setShowAdd(false); load();
  }

  async function saveEdit(room: RoomRow) {
    if (!editName.trim()) return;
    updateDemoDatabase((db) => {
      db.rooms = db.rooms.map((item) => item.id === room.id ? { ...item, name: editName.trim() } : item);
      addAuditLog(db, "room.update", "room", room.id, { old_name: room.name, new_name: editName.trim() });
    });
    setEditId(null); load();
  }

  async function removeRoom(room: RoomRow) {
    if (!confirm(`Remove "${room.name}"? It won't appear in the rack anymore.`)) return;
    updateDemoDatabase((db) => {
      db.rooms = db.rooms.map((item) => item.id === room.id ? { ...item, status: "inactive" } : item);
      addAuditLog(db, "room.delete", "room", room.id, { name: room.name });
    });
    load();
  }

  const activeRooms = rooms.filter(r => r.status === "active");
  const grouped = cats.map(c => ({ cat: c, rooms: activeRooms.filter(r => r.category_id === c.id) }))
    .filter(g => g.rooms.length > 0);

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">‹</button>
        <h2 className="font-semibold text-sm">Manage Rooms</h2>
        <span className="text-xs text-slate-400 ml-1">({activeRooms.length} active)</span>
        <button onClick={() => setShowAdd(!showAdd)}
          className="ml-auto text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-medium">
          + Add Room
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addRoom} className="p-4 bg-slate-50 border-b flex gap-2 flex-shrink-0">
          <select value={newCatId} onChange={e => setNewCatId(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none flex-1">
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Room name"
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1" />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Add</button>
        </form>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading rooms...</div>
        ) : grouped.map(({ cat, rooms: gr }) => (
          <div key={cat.id}>
            <div className="px-4 py-2 bg-slate-100 sticky top-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{cat.name}</span>
              <span className="text-xs text-slate-400 ml-2">({gr.length})</span>
            </div>
            {gr.map(room => (
              <div key={room.id} className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100">
                {editId === room.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <button onClick={() => saveEdit(room)} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-slate-500 px-2 py-1">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800">{room.name}</span>
                    <button onClick={() => { setEditId(room.id); setEditName(room.name); }}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={() => removeRoom(room)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Remove</button>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
