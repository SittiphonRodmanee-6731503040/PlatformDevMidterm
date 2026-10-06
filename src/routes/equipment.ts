import { Hono } from "hono";
import { db } from "../db.js";
import type { Equipment } from "../types.js";

export const equipmentRoutes = new Hono();

equipmentRoutes.get("/", (c) => {
  const rows = db
    .prepare("SELECT id, name, location FROM equipment ORDER BY id")
    .all() as Equipment[];
  return c.json(rows);
});
