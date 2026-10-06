# API Contract

The API runs as a Cloudflare Worker with a D1 database binding named `DB`.

All errors use `{ "error": "message" }`. Dates are normalized to ISO 8601 UTC.
Intervals are half-open: an end time equal to another booking's start is allowed.

| Method | Path | Success | Errors |
|---|---|---:|---|
| GET | `/equipment` | 200 | — |
| GET | `/bookings?equipmentId=eq-1` | 200 | — |
| GET | `/bookings/:id` | 200 | 404 |
| POST | `/bookings` | 201 | 400, 404, 409 |
| PATCH | `/bookings/:id` | 200 | 400, 404, 409 |
| DELETE | `/bookings/:id` | 204 | 404 |

POST requires `equipmentId`, `borrowerName`, `startAt`, and `endAt`.
`purpose` is optional. PATCH accepts any subset and validates the merged result.
Missing or malformed fields return 400; a valid but unknown equipment ID returns
404; an overlapping booking returns 409.
