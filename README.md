# Equipment Booking API

A local REST API for booking shared faculty equipment without overlapping
reservations for the same equipment. It uses Hono, TypeScript, and SQLite
(`better-sqlite3`).

## Run

```bash
npm install
npm run dev
```

The API listens at `http://localhost:8787`. The SQLite database is created and
seeded at `data/bookings.db` on first start.

Run the automated curl-based checks in a second terminal:

```bash
npm test
```

See [API_CONTRACT.md](./API_CONTRACT.md) for endpoints and response codes,
[SCHEMA.md](./SCHEMA.md) for the data model, and
[QUALITY_GATE_REVIEW.md](./QUALITY_GATE_REVIEW.md) for the reliability and
security review.