"use client";

import { useState, useEffect } from "react";
import { addAuditLog, makeId, updateDemoDatabase } from "@/lib/demo-store";
import type { Reservation, Room, PaymentStatus } from "@/types";
import { format } from "date-fns";

interface Props {
  reservation: Reservation | null;
  defaultRoom: Room | null;
  defaultDate: string | null;
  rooms: Room[];
  onClose: () => void;
  onSaved: () => void;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  advance_paid: "Advance Paid",
  full_paid: "Full Paid",
  cancelled: "Cancelled",
};

export default function ReservationModal({
  reservation,
  defaultRoom,
  defaultDate,
  rooms,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!reservation;

  const [guestName, setGuestName] = useState(reservation?.guest_name ?? "");
  const [guestPhone, setGuestPhone] = useState(reservation?.guest_phone ?? "");
  const [checkIn, setCheckIn] = useState(
    reservation?.check_in ?? defaultDate ?? format(new Date(), "yyyy-MM-dd")
  );
  const [checkOut, setCheckOut] = useState(() => {
    if (reservation?.check_out) return reservation.check_out;
    const d = new Date(defaultDate ?? new Date());
    d.setDate(d.getDate() + 1);
    return format(d, "yyyy-MM-dd");
  });
  const [numGuests, setNumGuests] = useState(reservation?.num_guests ?? 1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    reservation?.payment_status ?? "pending"
  );
  const [notes, setNotes] = useState(reservation?.notes ?? "");
  const [roomId, setRoomId] = useState<string>(
    reservation?.room_id ?? defaultRoom?.id ?? rooms[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!roomId) { setError("Please select a room."); return; }
    if (checkOut <= checkIn) { setError("Check-out must be after check-in."); return; }

    setLoading(true);

    const payload = {
      room_id: roomId,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim() || null,
      check_in: checkIn,
      check_out: checkOut,
      num_guests: numGuests,
      payment_status: paymentStatus,
      notes: notes.trim() || null,
    };

    const id = reservation?.id ?? makeId("reservation");
    updateDemoDatabase((db) => {
      if (isEdit) {
        db.reservations = db.reservations.map((item) => item.id === id ? { ...item, ...payload } : item);
      } else {
        db.reservations.push({ id, ...payload, created_at: new Date().toISOString() });
      }
      addAuditLog(db, isEdit ? "reservation.update" : "reservation.create", "reservation", id, {
        guest_name: payload.guest_name,
        check_in: payload.check_in,
        check_out: payload.check_out,
      });
    });
    setLoading(false);
    onSaved();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading(true);
    updateDemoDatabase((db) => {
      db.reservations = db.reservations.filter((item) => item.id !== reservation!.id);
      addAuditLog(db, "reservation.delete", "reservation", reservation!.id, { guest_name: reservation!.guest_name });
    });
    setLoading(false);
    onSaved();
  }

  const selectedRoom = rooms.find((r) => r.id === roomId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-slate-800">
            {isEdit ? "Edit Reservation" : "New Reservation"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Room selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Room
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.category_name} — {r.name}
                </option>
              ))}
            </select>
            {selectedRoom && (
              <p className="text-xs text-slate-400">{selectedRoom.category_name}</p>
            )}
          </div>

          {/* Guest name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Guest Name *
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Phone
            </label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Check-in *
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Check-out *
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                min={checkIn}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Guests + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                No. of Guests
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Special requests, advance amount, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  confirmDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-red-300 text-red-600 hover:bg-red-50"
                }`}
              >
                {confirmDelete ? "Confirm Delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
