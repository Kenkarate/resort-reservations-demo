"use client";

import { createDemoDatabase } from "@/lib/demo-data";
import type { AuditLog, DemoDatabase } from "@/types";

const STORAGE_KEY = "resort-portfolio-demo-v1";
export const DEMO_USER_EMAIL = "portfolio.visitor@demo.local";
let memoryDatabase: DemoDatabase | null = null;

function isDatabase(value: unknown): value is DemoDatabase {
  if (!value || typeof value !== "object") return false;
  const db = value as Partial<DemoDatabase>;
  return db.version === 1 && Array.isArray(db.rooms) && Array.isArray(db.reservations)
    && Array.isArray(db.categories) && Array.isArray(db.users) && Array.isArray(db.auditLogs);
}

export function readDemoDatabase(): DemoDatabase {
  if (typeof window === "undefined") return createDemoDatabase();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isDatabase(parsed)) {
        memoryDatabase = parsed;
        return parsed;
      }
    }
  } catch {
    if (memoryDatabase) return memoryDatabase;
  }
  const seed = createDemoDatabase();
  writeDemoDatabase(seed);
  return seed;
}

export function writeDemoDatabase(db: DemoDatabase) {
  if (typeof window === "undefined") return;
  memoryDatabase = db;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Keep the current session usable when storage is blocked or full.
  }
  window.dispatchEvent(new CustomEvent("resort-demo-change"));
}

export function updateDemoDatabase(change: (db: DemoDatabase) => DemoDatabase | void): DemoDatabase {
  const current = readDemoDatabase();
  const draft = structuredClone(current);
  const next = change(draft) ?? draft;
  writeDemoDatabase(next);
  return next;
}

export function resetDemoDatabase(): DemoDatabase {
  const seed = createDemoDatabase();
  writeDemoDatabase(seed);
  return seed;
}

export function makeId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

export function addAuditLog(
  db: DemoDatabase,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown>
) {
  const log: AuditLog = {
    id: makeId("audit"),
    user_id: "demo-admin",
    user_email: DEMO_USER_EMAIL,
    action,
    entity,
    entity_id: entityId,
    details,
    created_at: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
}
