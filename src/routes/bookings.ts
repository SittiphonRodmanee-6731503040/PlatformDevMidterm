import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { validateBooking, ValidationError } from "../validation.js";
import type { Booking, BookingInput } from "../types.js";

export const bookingRoutes = new Hono<AppEnv>();

const selectFields = `
  id, equipment_id AS equipmentId, borrower_name AS borrowerName,
  start_at AS startAt, end_at AS endAt, purpose, created_at AS createdAt
`;

function parseBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  return c.req.json().catch(() => {
    throw new ValidationError("request body must be valid JSON");
  });
}

async function getBooking(db: D1Database, id: string): Promise<Booking | null> {
  return db.prepare(`SELECT ${selectFields} FROM bookings WHERE id = ?`)
    .bind(id).first<Booking>();
}

async function equipmentExists(db: D1Database, equipmentId: string): Promise<boolean> {
  return (await db.prepare("SELECT 1 FROM equipment WHERE id = ?").bind(equipmentId).first()) !== null;
}

bookingRoutes.get("/", async (c) => {
  const equipmentId = c.req.query("equipmentId");
  const query = equipmentId
    ? c.env.DB.prepare(`SELECT ${selectFields} FROM bookings WHERE equipment_id = ? ORDER BY start_at`).bind(equipmentId)
    : c.env.DB.prepare(`SELECT ${selectFields} FROM bookings ORDER BY start_at`);
  const { results } = await query.all<Booking>();
  return c.json(results);
});

bookingRoutes.get("/:id", async (c) => {
  const booking = await getBooking(c.env.DB, c.req.param("id"));
  return booking ? c.json(booking) : c.json({ error: "booking not found" }, 404);
});

bookingRoutes.post("/", async (c) => {
  const input = validateBooking(await parseBody(c));
  if (!(await equipmentExists(c.env.DB, input.equipmentId))) {
    return c.json({ error: "equipment not found" }, 404);
  }
  const id = crypto.randomUUID();
  const result = await c.env.DB.prepare(`
    INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose, created_at)
    SELECT ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE equipment_id = ? AND start_at < ? AND end_at > ?
    )
  `).bind(
    id,
    input.equipmentId,
    input.borrowerName,
    input.startAt,
    input.endAt,
    input.purpose,
    new Date().toISOString(),
    input.equipmentId,
    input.endAt,
    input.startAt,
  ).run();
  if (result.meta.changes === 0) {
    return c.json({ error: "booking overlaps an existing booking" }, 409);
  }
  return c.json(await getBooking(c.env.DB, id), 201);
});

bookingRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const current = await getBooking(c.env.DB, id);
  if (!current) return c.json({ error: "booking not found" }, 404);
  const input = validateBooking(await parseBody(c), current);
  if (!(await equipmentExists(c.env.DB, input.equipmentId))) {
    return c.json({ error: "equipment not found" }, 404);
  }
  const result = await c.env.DB.prepare(`
    UPDATE bookings
    SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
    WHERE id = ? AND NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE equipment_id = ? AND start_at < ? AND end_at > ? AND id != ?
    )
  `).bind(
    input.equipmentId,
    input.borrowerName,
    input.startAt,
    input.endAt,
    input.purpose,
    id,
    input.equipmentId,
    input.endAt,
    input.startAt,
    id,
  ).run();
  if (result.meta.changes === 0) {
    return c.json({ error: "booking overlaps an existing booking" }, 409);
  }
  return c.json(await getBooking(c.env.DB, id));
});

bookingRoutes.delete("/:id", async (c) => {
  const result = await c.env.DB.prepare("DELETE FROM bookings WHERE id = ?")
    .bind(c.req.param("id")).run();
  return result.meta.changes > 0
    ? c.body(null, 204)
    : c.json({ error: "booking not found" }, 404);
});
