import { addDays, format, startOfDay } from "date-fns";
import type { Category, DemoDatabase, Reservation, Room } from "@/types";

const CATEGORY_NAMES = ["Garden Rooms", "Ocean Rooms", "Family Suites", "Pool Villas"];
const ROOM_NAMES = [
  ["G101", "G102", "G103", "G104"],
  ["O201", "O202", "O203", "O204"],
  ["F301", "F302", "F303"],
  ["V401", "V402", "V403"],
];

function isoDay(offset: number) {
  return format(addDays(startOfDay(new Date()), offset), "yyyy-MM-dd");
}

export function createDemoDatabase(): DemoDatabase {
  const categories: Category[] = CATEGORY_NAMES.map((name, index) => ({
    id: `category-${index + 1}`,
    name,
    sort_order: index + 1,
  }));

  const rooms: Room[] = ROOM_NAMES.flatMap((names, categoryIndex) =>
    names.map((name, roomIndex) => ({
      id: `room-${categoryIndex + 1}-${roomIndex + 1}`,
      name,
      category_id: categories[categoryIndex].id,
      category_name: categories[categoryIndex].name,
      sort_order: roomIndex + 1,
      status: "active" as const,
    }))
  );

  const samples: Array<Omit<Reservation, "id" | "created_at" | "room_id"> & { room: number }> = [
    { room: 0, guest_name: "Maya Lewis", guest_phone: "+356 7900 1101", check_in: isoDay(-2), check_out: isoDay(2), num_guests: 2, payment_status: "full_paid", notes: "Late arrival" },
    { room: 1, guest_name: "Noah Martin", guest_phone: null, check_in: isoDay(1), check_out: isoDay(5), num_guests: 2, payment_status: "advance_paid", notes: null },
    { room: 4, guest_name: "Sofia Clarke", guest_phone: "+356 7900 1103", check_in: isoDay(-5), check_out: isoDay(1), num_guests: 1, payment_status: "pending", notes: "Airport pickup requested" },
    { room: 6, guest_name: "Daniel Rossi", guest_phone: null, check_in: isoDay(4), check_out: isoDay(9), num_guests: 2, payment_status: "advance_paid", notes: null },
    { room: 8, guest_name: "The Carter Family", guest_phone: "+356 7900 1105", check_in: isoDay(-1), check_out: isoDay(6), num_guests: 4, payment_status: "full_paid", notes: "Cot required" },
    { room: 11, guest_name: "Amelia Stone", guest_phone: null, check_in: isoDay(7), check_out: isoDay(12), num_guests: 2, payment_status: "pending", notes: null },
    { room: 13, guest_name: "Liam Wilson", guest_phone: null, check_in: isoDay(10), check_out: isoDay(14), num_guests: 3, payment_status: "cancelled", notes: "Demo cancellation" },
  ];

  const reservations: Reservation[] = samples.map(({ room, ...sample }, index) => ({
    ...sample,
    id: `reservation-${index + 1}`,
    room_id: rooms[room].id,
    created_at: new Date().toISOString(),
  }));

  return {
    version: 1,
    categories,
    rooms,
    reservations,
    users: [
      { id: "demo-admin", email: "portfolio.visitor@demo.local", role: "admin", created_at: new Date().toISOString(), last_sign_in: new Date().toISOString() },
      { id: "demo-staff", email: "frontdesk@demo.local", role: "staff", created_at: new Date().toISOString(), last_sign_in: null },
    ],
    auditLogs: [],
  };
}
