# Schema

`equipment (1) ──── (*) bookings`

```sql
CREATE TABLE equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  borrower_name TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  purpose TEXT,
  created_at TEXT NOT NULL,
  CHECK (start_at < end_at)
);
CREATE INDEX idx_bookings_eq_time
  ON bookings (equipment_id, start_at, end_at);
```

The overlap predicate is `existing.start_at < new.end_at AND
existing.end_at > new.start_at`, with `id != ?` when updating.
