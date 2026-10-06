# AI Assistance Log

This log records significant AI assistance used during development. The
implementation was reviewed, tested, and adjusted against the API contract
before deployment.

| # | Prompt or task summary | What AI assistance provided | What I accepted, changed, or rejected | How I verified it myself |
|---:|---|---|---|---|
| 1 | Design a campus equipment booking API from the practical-lab requirements | Suggested the Hono route structure, booking fields, status codes, validation rules, and SQLite/D1 schema | Kept the required CRUD routes and chose `400` for invalid input, `404` for missing resources, and `409` for valid overlapping bookings | Compared the design with the task contract and tested the routes with Postman |
| 2 | Implement booking overlap detection | Proposed the half-open interval rule: `existing.startAt < new.endAt AND existing.endAt > new.startAt` | Kept strict `<` and `>` comparisons so back-to-back bookings are allowed | Tested an overlapping booking expecting `409` and a back-to-back booking expecting `201` |
| 3 | Add PATCH support | Suggested merging the existing booking with the PATCH body, validating the merged result, and excluding the current booking from conflict checks | Kept partial PATCH behavior and the `id != ?` self-exclusion condition | Updated a booking's purpose, kept the same time range, and tested an overlapping update |
| 4 | Migrate the local Node/SQLite implementation to Cloudflare Workers and D1 | Suggested Wrangler configuration, D1 bindings, migrations, and asynchronous D1 queries | Replaced `better-sqlite3` and the Node server with a Worker entry point and `DB` binding; moved schema and seed data into a D1 migration | Ran `npm run typecheck`, `npm run build`, applied the remote migration, deployed with Wrangler, and checked the live API |
| 5 | Review the Quality Gate | Identified reliability, accuracy, security, and documentation checks | Corrected the review document to describe D1 rather than the removed local SQLite transaction | Reviewed the source, ran live endpoint checks, and recorded the findings in `QUALITY_GATE_REVIEW.md` |
| 6 | Create API and database documentation | Helped structure `API_CONTRACT.md`, `SCHEMA.md`, and the PlantUML ERD | Checked names, fields, relationship cardinality, constraints, and production URL against the deployed implementation | Compared each document with the Worker routes and D1 migration |

## Important design decisions I reviewed

- Booking intervals are half-open: `[startAt, endAt)`.
- Equal end and start times are valid for back-to-back bookings.
- A valid but unavailable time range returns `409 Conflict`.
- Missing or malformed request data returns `400 Bad Request`.
- A valid but unknown equipment ID returns `404 Not Found`.
- PATCH requests merge with the current booking before validation.
- SQL values are passed through D1 `.bind(...)`; request data is not
  concatenated into SQL.
- The create and update statements use conditional `NOT EXISTS` writes so the
  overlap check and mutation occur together in the D1 statement.

## Verification summary

- TypeScript type checking passed with `npm run typecheck`.
- Wrangler dry-run build passed with `npm run build`.
- The remote D1 migration completed successfully.
- The Worker deployed successfully through Wrangler.
- The live `GET /equipment` endpoint returned `200` with seeded equipment.
- Postman tests covered successful CRUD requests, overlap rejection,
  back-to-back bookings, validation errors, unknown equipment, and deletion.
