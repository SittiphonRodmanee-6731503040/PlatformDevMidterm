import { Hono } from "hono";
import { db } from "../db.js";
import { validateBooking, ValidationError } from "../validation.js";
import type { Booking, BookingInput } from "../types.js";

export const bookingRoutes = new Hono();

const selectFields = `
  id, equipment_id AS equipmentId, borrower_name AS borrowerName,
  start_at AS startAt, end_at AS endAt, purpose, created_at AS createdAt
`;
const findBooking = db.prepare(`SELECT ${selectFields} FROM bookings WHERE id = ?`);
const equipmentExists = db.prepare("SELECT 1 FROM equipment WHERE id = ?");
const conflict = db.prepare(`
  SELECT id FROM bookings
  WHERE equipment_id = ? AND start_at < ? AND end_at > ? AND id != ?
  LIMIT 1
`);

function parseBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  return c.req.json().catch(() => {
    throw new ValidationError("request body must be valid JSON");
  });
}

function toBooking(row: unknown): Booking {
  return row as Booking;
}

bookingRoutes.get("/", (c) => {
  const equipmentId = c.req.query("equipmentId");
  const rows = equipmentId
    ? db.prepare(`SELECT ${selectFields} FROM bookings WHERE equipment_id = ? ORDER BY start_at`).all(equipmentId)
    : db.prepare(`SELECT ${selectFields} FROM bookings ORDER BY start_at`).all();
  return c.json(rows);
});

bookingRoutes.get("/:id", (c) => {
  const row = findBooking.get(c.req.param("id"));
  return row ? c.json(toBooking(row)) : c.json({ error: "booking not found" }, 404);
});

bookingRoutes.post("/", async (c) => {
  const input = validateBooking(await parseBody(c));
  if (!equipmentExists.get(input.equipmentId)) {
    return c.json({ error: "equipment not found" }, 404);
  }
  const id = crypto.randomUUID();
  const create = db.transaction((booking: BookingInput) => {
    if (conflict.get(booking.equipmentId, booking.endAt, booking.startAt, id)) {
      return false;
    }
    db.prepare(`
      INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, booking.equipmentId, booking.borrowerName, booking.startAt, booking.endAt, booking.purpose, new Date().toISOString());
    return true;
  });
  if (!create(input)) {
    return c.json({ error: "booking overlaps an existing booking" }, 409);
  }
  return c.json(toBooking(findBooking.get(id)), 201);
});

bookingRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const current = findBooking.get(id) as Booking | undefined;
  if (!current) return c.json({ error: "booking not found" }, 404);
  const input = validateBooking(await parseBody(c), current);
  if (!equipmentExists.get(input.equipmentId)) {
    return c.json({ error: "equipment not found" }, 404);
  }
  const update = db.transaction((booking: BookingInput) => {
    if (conflict.get(booking.equipmentId, booking.endAt, booking.startAt, id)) return false;
    db.prepare(`
      UPDATE bookings SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
      WHERE id = ?
    `).run(booking.equipmentId, booking.borrowerName, booking.startAt, booking.endAt, booking.purpose, id);
    return true;
  });
  if (!update(input)) return c.json({ error: "booking overlaps an existing booking" }, 409);
  return c.json(toBooking(findBooking.get(id)));
});

bookingRoutes.delete("/:id", (c) => {
  const result = db.prepare("DELETE FROM bookings WHERE id = ?").run(c.req.param("id"));
  return result.changes ? c.body(null, 204) : c.json({ error: "booking not found" }, 404);
});
