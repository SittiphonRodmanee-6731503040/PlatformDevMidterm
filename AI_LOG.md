# AI Log

| # | Prompt summary | What was used | What changed / verification |
|---|---|---|---|
| 1 | Design the booking API from the supplied plan | Route and schema structure | Re-checked status codes, validation, and overlap boundaries with curl tests |
| 2 | Implement SQLite overlap prevention | Parameter-bound predicate and transaction | Added self-exclusion for PATCH and tested overlap, back-to-back, and different equipment |
