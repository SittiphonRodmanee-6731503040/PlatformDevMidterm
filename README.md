# Equipment Booking API

A Cloudflare Worker REST API for booking shared faculty equipment without
overlapping reservations for the same equipment. It uses Hono, TypeScript, and
Cloudflare D1.

## Run

```bash
npm install
npm run db:migrate:local
npm run dev
```

The local Worker listens at `http://localhost:8787`. Local D1 data is separate
from production D1 data.

Run the automated curl-based checks in a second terminal:

```bash
npm test
```

See [API_CONTRACT.md](./API_CONTRACT.md) for endpoints and response codes,
[SCHEMA.md](./SCHEMA.md) for the data model, and
[QUALITY_GATE_REVIEW.md](./QUALITY_GATE_REVIEW.md) for the reliability and
security review.

## Cloudflare setup

1. Install and authenticate Wrangler:

   ```bash
   npx wrangler login
   ```

2. Create the production database:

   ```bash
   npx wrangler d1 create equipment-bookings
   ```

3. Copy the returned database ID into
   [wrangler.jsonc](./wrangler.jsonc), replacing
   `REPLACE_WITH_D1_DATABASE_ID`.

4. Apply the schema and seed data:

   ```bash
   npm run db:migrate:local
   npm run db:migrate:remote
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

The only project-specific value needed from the account owner is the D1
database ID, unless they run the database creation command themselves. Never
send an API token or password in chat. If Workers AI is added later, it will
require an explicit `AI` binding in `wrangler.jsonc`; this booking API does not
need Workers AI to operate.