import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

export const db = new Database(path.join(dataDirectory, "bookings.db"));
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL REFERENCES equipment(id),
    borrower_name TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    purpose TEXT,
    created_at TEXT NOT NULL,
    CHECK (start_at < end_at)
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_eq_time
    ON bookings (equipment_id, start_at, end_at);
`);

const seed = db.prepare(
  "INSERT OR IGNORE INTO equipment (id, name, location) VALUES (?, ?, ?)",
);
for (const item of [
  ["eq-1", "Projector A", "Building 1"],
  ["eq-2", "Camera Canon R6", "Media Lab"],
  ["eq-3", "Meeting Room 301", "Building 2"],
]) {
  seed.run(...item);
}
