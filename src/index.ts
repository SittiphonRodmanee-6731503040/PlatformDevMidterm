import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { bookingRoutes } from "./routes/bookings.js";
import { equipmentRoutes } from "./routes/equipment.js";
import { ValidationError } from "./validation.js";

const app = new Hono();
app.use("*", cors({
  origin: (origin) => ["http://localhost:5173", "http://localhost:8787"].includes(origin) ? origin : "",
}));
app.route("/equipment", equipmentRoutes);
app.route("/bookings", bookingRoutes);

app.notFound((c) => c.json({ error: "route not found" }, 404));
app.onError((error, c) => {
  if (error instanceof ValidationError) return c.json({ error: error.message }, 400);
  console.error(error);
  return c.json({ error: "internal server error" }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) });
console.log("Equipment Booking API listening on http://localhost:8787");
