"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  addDays,
  format,
  differenceInDays,
  startOfDay,
  parseISO,
  isToday,
  isWeekend,
} from "date-fns";
import { DEMO_USER_EMAIL, readDemoDatabase, resetDemoDatabase } from "@/lib/demo-store";
import ReservationModal from "@/components/ReservationModal";
import AdminPanel from "@/components/AdminPanel";
import GuidedTour from "@/components/GuidedTour";
import type { Reservation, Room } from "@/types";

// Room column width
const ROOM_COL_W = 96;
const ROW_H = 17;
const DAYS_SHOWN = 35;
const DAY_W_MIN = 10;
const DAY_W_MAX = 90;

// Calculate initial dayW so the full 35-day range fits the device screen
function calcInitialDayW(): number {
  if (typeof window === "undefined") return 26;
  return Math.max(Math.floor((window.innerWidth - ROOM_COL_W) / DAYS_SHOWN), DAY_W_MIN);
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:      { bg: "#fbbf24", border: "#d97706", text: "#78350f" },
  advance_paid: { bg: "#60a5fa", border: "#2563eb", text: "#1e3a5f" },
  full_paid:    { bg: "#34d399", border: "#059669", text: "#064e3b" },
  cancelled:    { bg: "#d1d5db", border: "#9ca3af", text: "#6b7280" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  advance_paid: "Advance Paid",
  full_paid: "Full Paid",
  cancelled: "Cancelled",
};

interface Props {
  initialRooms: Room[];
  initialReservations: Reservation[];
}

export default function RoomRackClient({ initialRooms, initialReservations }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // dayW drives column width; ref keeps value fresh inside native touch handlers
  const [dayW, setDayWState] = useState<number>(calcInitialDayW);
  const dayWRef = useRef<number>(calcInitialDayW());

  function setDayW(v: number) {
    const clamped = Math.round(Math.min(Math.max(v, DAY_W_MIN), DAY_W_MAX));
    dayWRef.current = clamped;
    setDayWState(clamped);
  }

  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return startOfDay(d);
  });
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [modal, setModal] = useState<{
    reservation: Reservation | null;
    defaultRoom: Room | null;
    defaultDate: string | null;
  } | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const canEdit = true;

  function loadLocalData() {
    const db = readDemoDatabase();
    setRooms(db.rooms.filter((room) => room.status !== "inactive"));
    setReservations(db.reservations);
  }

  useEffect(() => {
    loadLocalData();
    const onChange = () => loadLocalData();
    window.addEventListener("resort-demo-change", onChange);
    return () => window.removeEventListener("resort-demo-change", onChange);
  }, []);

  // ── On mount: scroll so today is near the left edge ───────────────────────
  useEffect(() => {
    const today = startOfDay(new Date());
    const offset = differenceInDays(today, viewStart) * dayWRef.current;
    scrollRef.current?.scrollTo({ left: Math.max(0, offset - dayWRef.current) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pinch-zoom (non-passive so we can preventDefault) ─────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let startDist = 0;
    let startDayW = dayWRef.current;

    function dist(touches: TouchList) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startDayW = dayWRef.current;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || startDist === 0) return;
      e.preventDefault();
      const next = Math.round(
        Math.min(Math.max((dist(e.touches) / startDist) * startDayW, DAY_W_MIN), DAY_W_MAX)
      );
      dayWRef.current = next;
      setDayWState(next);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const dates = useMemo(
    () => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(viewStart, i)),
    [viewStart]
  );
  const viewEnd = useMemo(() => addDays(viewStart, DAYS_SHOWN), [viewStart]);

  // Month tabs: Jan 2025 → Dec 2027
  const months = useMemo(() => {
    const result: Date[] = [];
    for (let y = 2025; y <= 2027; y++) {
      for (let m = 0; m < 12; m++) result.push(new Date(y, m, 1));
    }
    return result;
  }, []);

  const groupedRooms = useMemo(() => {
    const map = new Map<string, Room[]>();
    rooms.forEach((r) => {
      if (!map.has(r.category_name)) map.set(r.category_name, []);
      map.get(r.category_name)!.push(r);
    });
    return map;
  }, [rooms]);

  function refreshReservations() {
    loadLocalData();
    setModal(null);
  }

  function openCreate(room: Room, date: Date) {
    if (!canEdit) return;
    setModal({ reservation: null, defaultRoom: room, defaultDate: format(date, "yyyy-MM-dd") });
  }

  function openEdit(res: Reservation, e: React.MouseEvent) {
    e.stopPropagation();
    if (!canEdit) return;
    setModal({ reservation: res, defaultRoom: null, defaultDate: null });
  }

  function handleReset() {
    if (!window.confirm("Reset all rooms, reservations, users, and audit history to the original demo data?")) return;
    const seed = resetDemoDatabase();
    setRooms(seed.rooms);
    setReservations(seed.reservations);
    setModal(null);
  }

  function goToToday() {
    const today = startOfDay(new Date());
    const newStart = startOfDay(new Date());
    newStart.setDate(1);
    setViewStart(newStart);
    setTimeout(() => {
      const offset = differenceInDays(today, newStart) * dayWRef.current;
      scrollRef.current?.scrollTo({ left: Math.max(0, offset - dayWRef.current), behavior: "smooth" });
    }, 50);
  }

  function roomReservations(roomId: string) {
    return reservations.filter(
      (r) =>
        r.room_id === roomId &&
        r.check_in < format(viewEnd, "yyyy-MM-dd") &&
        r.check_out > format(viewStart, "yyyy-MM-dd")
    );
  }

  function resBar(res: Reservation) {
    const rawLeft = differenceInDays(parseISO(res.check_in), viewStart) * dayW;
    const rawWidth = differenceInDays(parseISO(res.check_out), parseISO(res.check_in)) * dayW - 1;
    const clampedLeft = Math.max(0, rawLeft);
    const clampedWidth = Math.max(rawWidth - (rawLeft < 0 ? -rawLeft : 0), Math.max(dayW - 1, 4));
    const colors = STATUS_COLORS[res.payment_status] ?? STATUS_COLORS.pending;
    const isCancelled = res.payment_status === "cancelled";

    return (
      <div
        key={res.id}
        onClick={(e) => openEdit(res, e)}
        title={`${res.guest_name}${res.guest_phone ? " · " + res.guest_phone : ""}\n${res.check_in} → ${res.check_out} · ${res.num_guests} pax\n${STATUS_LABELS[res.payment_status]}`}
        style={{
          position: "absolute",
          left: clampedLeft + 1,
          width: clampedWidth,
          top: 2,
          height: ROW_H - 4,
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 3,
          padding: dayW >= 40 ? "0 5px" : 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          zIndex: 10,
          opacity: isCancelled ? 0.45 : 1,
          textDecoration: isCancelled ? "line-through" : "none",
          whiteSpace: "nowrap",
          userSelect: "none",
          boxSizing: "border-box",
        }}
      >
        {/* Show name only when zoomed in enough to read it */}
        {dayW >= 40 && (
          <span style={{ fontSize: 10, fontWeight: 600, color: colors.text, overflow: "hidden", textOverflow: "ellipsis" }}>
            {res.guest_name}
            {res.num_guests > 1 && (
              <span style={{ fontWeight: 400, marginLeft: 3 }}>·{res.num_guests}</span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── Top bar ── */}
      <div data-tour="demo-status" className="flex items-center gap-2 bg-cyan-50 border-b border-cyan-200 px-3 py-1.5 text-[11px] text-cyan-900 flex-shrink-0">
        <strong>Portfolio demo</strong>
        <span className="truncate">Fictional data · changes stay in this browser only</span>
        <button data-tour="reset-demo" onClick={handleReset} className="ml-auto whitespace-nowrap rounded bg-white border border-cyan-300 px-2 py-1 font-semibold hover:bg-cyan-100">Reset demo</button>
      </div>
      <header className="flex items-center gap-1 px-1.5 py-2 bg-slate-900 text-white flex-shrink-0 sm:gap-1.5 sm:px-2">
        <span className="hidden font-bold text-sm tracking-tight mr-1 sm:inline">Resort Demo</span>

        <div className="flex-1" />

        {/* Prev / Today / Next */}
        <div data-tour="date-navigation" className="flex items-center gap-1.5">
          <button onClick={() => setViewStart((d) => addDays(d, -DAYS_SHOWN))}
            className="h-8 px-2 text-sm bg-slate-700 active:bg-slate-500 rounded text-white select-none">‹</button>
          <button onClick={goToToday}
            className="h-8 px-2.5 text-sm bg-blue-600 active:bg-blue-400 rounded text-white font-medium select-none">Today</button>
          <button onClick={() => setViewStart((d) => addDays(d, DAYS_SHOWN))}
            className="h-8 px-2 text-sm bg-slate-700 active:bg-slate-500 rounded text-white select-none">›</button>
        </div>

        {/* Zoom − / + */}
        <div data-tour="zoom-controls" className="flex items-center gap-0.5 ml-1">
          <button onClick={() => setDayW(dayW - 6)} disabled={dayW <= DAY_W_MIN}
            className="h-8 w-8 text-base bg-slate-700 active:bg-slate-500 rounded text-white disabled:opacity-30 select-none">−</button>
          <button onClick={() => setDayW(dayW + 6)} disabled={dayW >= DAY_W_MAX}
            className="h-8 w-8 text-base bg-slate-700 active:bg-slate-500 rounded text-white disabled:opacity-30 select-none">+</button>
        </div>

        {/* New reservation — hidden for view_only */}
        {canEdit && (
          <button
            data-tour="new-reservation"
            onClick={() => setModal({ reservation: null, defaultRoom: rooms[0] ?? null, defaultDate: format(new Date(), "yyyy-MM-dd") })}
            aria-label="New reservation"
            className="h-8 px-2 text-sm bg-emerald-600 active:bg-emerald-400 rounded text-white font-medium select-none sm:ml-1 sm:px-2.5">
            +<span className="hidden sm:inline"> New</span>
          </button>
        )}

        {/* Demo menu */}
        <button onClick={() => window.dispatchEvent(new CustomEvent("resort-demo-tour-start"))}
          aria-label="Start guided tour" title="Guided tour"
          className="h-8 w-8 flex items-center justify-center text-sm bg-slate-700 active:bg-slate-500 rounded text-slate-300 select-none">?</button>
        <button data-tour="demo-menu" onClick={() => setShowAdminPanel(true)}
          className="h-8 w-8 flex items-center justify-center text-base bg-slate-700 active:bg-slate-500 rounded text-slate-300 select-none">☰</button>
      </header>

      {/* ── Date range strip ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-0.5 bg-slate-800 text-slate-400 text-xs">
        <span className="font-medium text-slate-300">
          {format(viewStart, "d MMM")} — {format(addDays(viewStart, DAYS_SHOWN - 1), "d MMM yyyy")}
        </span>
        <span>{reservations.length} bookings</span>
        <div className="flex items-center gap-1.5 ml-auto">
          {Object.entries(STATUS_LABELS).map(([key]) => (
            <div key={key} className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: STATUS_COLORS[key].bg, border: `1px solid ${STATUS_COLORS[key].border}` }} />
          ))}
        </div>
      </div>

      {/* ── Room rack ── */}
      <div
        data-tour="room-rack"
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ minHeight: 0, WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {/* Inner block — wide enough to hold all date columns */}
        <div style={{ display: "inline-block", minWidth: ROOM_COL_W + DAYS_SHOWN * dayW }}>

          {/* Sticky date header */}
          <div style={{
            display: "flex", height: 32,
            position: "sticky", top: 0, zIndex: 40,
            background: "#1e293b", borderBottom: "2px solid #334155",
          }}>
            {/* Corner */}
            <div style={{
              width: ROOM_COL_W, minWidth: ROOM_COL_W,
              position: "sticky", left: 0, zIndex: 50,
              background: "#1e293b", borderRight: "2px solid #334155",
              display: "flex", alignItems: "center", paddingLeft: 8,
            }}>
              <span style={{ color: "#64748b", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Room</span>
            </div>

            {/* Date cells */}
            {dates.map((d) => {
              const todayFlag = isToday(d);
              const weekendFlag = isWeekend(d);
              return (
                <div key={d.toISOString()} style={{
                  width: dayW, minWidth: dayW, flexShrink: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRight: "1px solid #334155",
                  background: todayFlag ? "#1d4ed8" : "transparent",
                  color: todayFlag ? "white" : weekendFlag ? "#f87171" : "#64748b",
                }}>
                  {/* Day letter only when wide enough */}
                  {dayW >= 28 && (
                    <span style={{ fontSize: 7, fontWeight: 600, lineHeight: 1 }}>
                      {format(d, "EEEEE")}
                    </span>
                  )}
                  <span style={{ fontSize: dayW < 18 ? 7 : dayW < 28 ? 9 : 11, fontWeight: todayFlag ? 700 : 500, lineHeight: 1.2 }}>
                    {format(d, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Category groups + room rows */}
          {Array.from(groupedRooms.entries()).map(([catName, catRooms]) => (
            <div key={catName}>

              {/* Category label — sticky to left, text overflows into date area */}
              <div style={{ display: "flex", height: 20, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{
                  position: "sticky", left: 0, zIndex: 20,
                  minWidth: ROOM_COL_W,
                  background: "#f1f5f9",
                  display: "flex", alignItems: "center", paddingLeft: 8,
                  overflow: "visible", whiteSpace: "nowrap",
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {catName}
                  </span>
                </div>
              </div>

              {/* Room rows */}
              {catRooms.map((room) => {
                const roomRes = roomReservations(room.id);
                return (
                  <div key={room.id} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid #e2e8f0" }}>

                    {/* Sticky room name */}
                    <div style={{
                      width: ROOM_COL_W, minWidth: ROOM_COL_W,
                      position: "sticky", left: 0, zIndex: 20,
                      background: "white", borderRight: "2px solid #e2e8f0",
                      display: "flex", alignItems: "center",
                      paddingLeft: 8, paddingRight: 4,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {room.name}
                      </span>
                    </div>

                    {/* Date cells (clickable) + bars */}
                    <div style={{ display: "flex", flex: 1, position: "relative" }}>
                      {dates.map((d) => (
                        <div
                          key={d.toISOString()}
                          onClick={() => openCreate(room, d)}
                          style={{
                            width: dayW, minWidth: dayW, height: ROW_H, flexShrink: 0,
                            borderRight: "1px solid #e2e8f0",
                            background: isToday(d)
                              ? "rgba(29,78,216,0.06)"
                              : isWeekend(d)
                              ? "rgba(248,113,113,0.04)"
                              : "transparent",
                            cursor: "cell",
                          }}
                        />
                      ))}
                      {roomRes.map((res) => resBar(res))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ height: 32 }} />
        </div>
      </div>

      {/* ── Month footer ── */}
      <div style={{
        height: 38, flexShrink: 0,
        background: "#0f172a", borderTop: "1px solid #1e293b",
        display: "flex", overflowX: "auto", alignItems: "center",
        gap: 2, padding: "0 6px",
        WebkitOverflowScrolling: "touch" as const,
        scrollbarWidth: "none" as const,
      }}>
        {months.map((m) => {
          const active = format(m, "yyyy-MM") === format(viewStart, "yyyy-MM");
          return (
            <button
              key={m.toISOString()}
              onClick={() => setViewStart(startOfDay(m))}
              style={{
                padding: "4px 9px", borderRadius: 6,
                fontSize: 11, fontWeight: active ? 700 : 500,
                background: active ? "#1d4ed8" : "transparent",
                color: active ? "#fff" : "#64748b",
                border: active ? "none" : "1px solid #1e293b",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                letterSpacing: "0.04em",
              }}
            >
              {format(m, "MMMyy").toUpperCase()}
            </button>
          );
        })}
      </div>

      {showAdminPanel && (
        <AdminPanel
          userRole="admin"
          userEmail={DEMO_USER_EMAIL}
          onClose={() => setShowAdminPanel(false)}
          onDataChanged={loadLocalData}
        />
      )}

      {modal && (
        <ReservationModal
          reservation={modal.reservation}
          defaultRoom={modal.defaultRoom}
          defaultDate={modal.defaultDate}
          rooms={rooms}
          onClose={() => setModal(null)}
          onSaved={refreshReservations}
        />
      )}
      <GuidedTour />
    </div>
  );
}
