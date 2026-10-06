import { cors } from "hono/cors";
import { Hono } from "hono";
import { bookingRoutes } from "./routes/bookings";
import { equipmentRoutes } from "./routes/equipment";
import { ValidationError } from "./validation";

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.use("*", cors({
  origin: ["http://localhost:5173"],
}));
app.route("/equipment", equipmentRoutes);
app.route("/bookings", bookingRoutes);

app.notFound((c) => c.json({ error: "route not found" }, 404));
app.onError((error, c) => {
  if (error instanceof ValidationError) return c.json({ error: error.message }, 400);
  console.error(error);
  return c.json({ error: "internal server error" }, 500);
});

export default app;
