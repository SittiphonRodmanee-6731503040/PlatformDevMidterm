import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import type { Equipment } from "../types.js";

export const equipmentRoutes = new Hono<AppEnv>();

equipmentRoutes.get("/", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT id, name, location FROM equipment ORDER BY id")
    .all<Equipment>();
  return c.json(results);
});
