# Quality Gate Review

| Finding | Fix | Evidence |
|---|---|---|
| Back-to-back reservations must not conflict, while containment must conflict | Used strict `<` and `>` overlap comparisons | Test script covers adjacent and overlapping intervals |
| PATCH could accidentally conflict with its own existing row | Added `id != ?` to the conflict query | PATCH keeps the same interval successfully |
| Check-then-insert could race | Wrapped conflict check and insert in one SQLite transaction | `db.transaction` encloses both operations |
| Dates with offsets could make lexical comparisons unreliable | Normalize every accepted date with `toISOString()` | Stored values are UTC ISO strings |
| Request data must not become SQL | Every request value is passed as a bound parameter | No request interpolation in SQL |

The overlap rule follows the half-open interval model `[start, end)`: two
intervals overlap exactly when the existing interval starts before the new one
ends and ends after the new one starts.
