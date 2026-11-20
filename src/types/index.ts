export type PaymentStatus = "pending" | "advance_paid" | "full_paid" | "cancelled";
export type UserRole = "admin" | "staff" | "view_only";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface DemoUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in: string | null;
}

export interface Room {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  sort_order: number;
  status?: "active" | "inactive";
}

export interface Reservation {
  id: string;
  room_id: string;
  guest_name: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  num_guests: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface DemoDatabase {
  version: 1;
  categories: Category[];
  rooms: Room[];
  reservations: Reservation[];
  users: DemoUser[];
  auditLogs: AuditLog[];
}
