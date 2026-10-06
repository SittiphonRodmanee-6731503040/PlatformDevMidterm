# Campus Equipment Booking API Contract

## Service

The API is deployed as a Cloudflare Worker backed by Cloudflare D1.

```text
Base URL: https://equipment-booking-api.6731503040.workers.dev
```

The D1 database is exposed to the Worker through the `DB` binding. The API
currently does not require authentication.

All request and response bodies use JSON. Every error response uses this
format:

```json
{
  "error": "message"
}
```

## Rules and assumptions

- Dates must be valid ISO 8601 date strings and are returned normalized to
  UTC, for example `2027-01-10T09:00:00.000Z`.
- A booking uses a half-open interval: `[startAt, endAt)`.
- Back-to-back bookings are allowed. A booking ending at `11:00` does not
  conflict with one starting at `11:00`.
- Overlap checking applies only when the `equipmentId` values are the same.
- `PATCH` is partial. The existing booking and patch body are merged and the
  merged result is validated.
- `borrowerName` is trimmed and limited to 100 characters.
- `purpose` is optional, may be `null`, and is limited to 500 characters.
- Unknown JSON fields are ignored.

## Equipment

### List equipment

```http
GET /equipment
```

Response: `200 OK`

```json
[
  {
    "id": "eq-1",
    "name": "Projector A",
    "location": "Building 1"
  }
]
```

## Bookings

### List bookings

```http
GET /bookings
```

Optional filter:

```http
GET /bookings?equipmentId=eq-1
```

Response: `200 OK`

```json
[
  {
    "id": "aee3ce53-37b2-4dd3-81bb-3e31c9cd21da",
    "equipmentId": "eq-1",
    "borrowerName": "Somchai Jaidee",
    "startAt": "2027-01-10T09:00:00.000Z",
    "endAt": "2027-01-10T11:00:00.000Z",
    "purpose": "Class presentation",
    "createdAt": "2026-10-06T08:14:36.932Z"
  }
]
```

### Get one booking

```http
GET /bookings/:id
```

Response: `200 OK`

Errors:

- `404 Not Found` if the booking ID does not exist

### Create a booking

```http
POST /bookings
Content-Type: application/json
```

Request body:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2027-01-10T09:00:00.000Z",
  "endAt": "2027-01-10T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

Response: `201 Created`

Errors:

- `400 Bad Request` for malformed JSON, a non-object body, missing or invalid
  fields, invalid dates, or `startAt >= endAt`
- `404 Not Found` if the valid `equipmentId` does not exist
- `409 Conflict` if the time overlaps another booking for the same equipment

### Update a booking

```http
PATCH /bookings/:id
Content-Type: application/json
```

Example request body:

```json
{
  "purpose": "Updated class presentation"
}
```

Response: `200 OK` with the complete updated booking.

Errors:

- `400 Bad Request` for malformed JSON or an invalid merged booking
- `404 Not Found` if the booking or equipment does not exist
- `409 Conflict` if the updated interval overlaps another booking for the
  same equipment

The booking being updated is excluded from its own overlap check.

### Delete a booking

```http
DELETE /bookings/:id
```

Response: `204 No Content` with no response body.

Errors:

- `404 Not Found` if the booking ID does not exist

## Status code summary

| Situation | Status |
|---|---:|
| Successful equipment or booking read | `200` |
| Booking created | `201` |
| Booking deleted | `204` |
| Invalid JSON, missing field, wrong type, invalid date, or invalid time range | `400` |
| Booking or equipment does not exist | `404` |
| Booking overlaps another booking for the same equipment | `409` |
| Unknown route | `404` |
| Unexpected server error | `500` |

## Overlap rule

For a new or updated booking, an existing booking conflicts when:

```text
existing.startAt < new.endAt
AND
existing.endAt > new.startAt
```

The Worker uses parameter-bound D1 queries. Request values are not concatenated
into SQL statements. Create and update operations use conditional SQL writes
with `NOT EXISTS`, so the conflict check and mutation are performed together.
