# Quality Gate Review

| Quality Gate area | Finding | Action taken | Evidence |
|---|---|---|---|
| Reliability | Back-to-back reservations must not conflict, while containment must conflict | Used strict `<` and `>` overlap comparisons | Test script covers adjacent and overlapping intervals |
| Reliability | PATCH could accidentally conflict with its own existing row | Excluded the current booking with `id != ?` | PATCH keeps the same interval successfully |
| Reliability | Separate conflict checking and writing could race on D1 | Made POST and PATCH use one parameter-bound conditional SQL write with `NOT EXISTS` | The insert/update statement performs the conflict predicate and mutation atomically |
| Accuracy | Dates with offsets could make lexical comparisons unreliable | Normalize every accepted date with `toISOString()` | Stored values are UTC ISO strings |
| Security | Request data must not become SQL | Passed every request value through D1 `.bind(...)` | No request interpolation in SQL |

The overlap rule follows the half-open interval model `[start, end)`: two
intervals overlap exactly when the existing interval starts before the new one
ends and ends after the new one starts.

The deployed implementation uses Cloudflare D1, so the earlier local
`better-sqlite3` transaction approach is not part of the Worker code. The
conditional write is the D1-compatible replacement.

## Submission status

**REWORK before submission.** The updated Worker code must be deployed, and
`TEST_EVIDENCE.md` must contain recorded results for at least five successful
and error cases. The author should also rehearse the overlap predicate,
`400`/`404`/`409` decisions, D1 binding, and conditional write in their own
words before selecting READY.
