---
title: "Test-schema column defaults missing vs schema.rb under partial_inserts=true"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3789
claim: "2026-06-21T13:18:54Z"
assignee: "partial-inserts-test-schema-db-default-fidelity"
blocked-by: null
---

## Context

Surfaced auditing the AR-test partial_inserts ambient (RFC 0023
ar-test-suite-partial-inserts-ambient-divergence). Under Rails' test ambient
`partial_inserts = true`, an INSERT omits columns left at their model default,
relying on the DB column to supply that default. Several ported tests declare a
bespoke model default (`attribute("views_count", "integer", { default: 10 })`)
but build the table from a test schema (`defineSchema` / TEST_SCHEMA) that does
NOT carry the matching DB-column default. The column is then omitted from the
partial INSERT and the DB stores NULL/0 instead of the model default, so the
test reads the wrong value.

Example: `packages/activerecord/src/counter-cache.test.ts` "decrement counter by
specific amount" — `views_count` model default 10, table schema `views_count:
"integer"` (no default). With `partial_inserts = true`, create omits
views_count, DB has no default → decrement by 3 yields -3, expected 7. ~12
counter-cache tests fail this way; other bespoke-default tests are likely
affected.

Rails' real `topics` schema (schema.rb) carries `default:` on these columns, so
the partial INSERT and the DB agree. Convergence: the canonical TEST_SCHEMA (and
any model→DB default propagation) must mirror schema.rb column defaults so
partial inserts behave as in Rails. Note this intersects the canonical-schema
burndown (RFC 0019) — prefer fixing the canonical schema over per-test opt-outs.
A complication specific to counter-cache.test.ts: its bespoke models give the
same shared column (e.g. `views_count`, `replies_count`) **conflicting** per-test
defaults (0/5/10), so a single `defineSchema` column default cannot satisfy them
— the real fix needs per-model tables (canonical models) rather than one shared
bespoke schema.

The AR-test ambient was already flipped to `partial_inserts = true` (PR #3745,
matching Rails helper.rb). As an interim, `counter-cache.test.ts` carries a
**file-scoped opt-out** (`Base.partialInserts = false`, restored in afterAll)
marked with this story id. This story's completion removes that opt-out.

## Acceptance criteria

- [x] Enumerate ported tests whose model declares a column default the test
      schema omits (start: counter-cache.test.ts). counter-cache.test.ts was the
      only file needing a file-scoped opt-out on the ambient-flip branch (#3745).
- [x] Give counter-cache its Rails-faithful per-model tables/defaults (canonical
      models) so partial inserts read the model default without the file-scoped
      opt-out. PR #3789: local TEST_SCHEMA counter columns carry schema.rb
      `default: 0`; conflicting non-zero starts are seeded via `updateCounters`
      (a direct UPDATE, unaffected by partial inserts) on Rails' real
      `replies_count`/`books_count` columns.
- [x] Remove the `Base.partialInserts = false` opt-out block. The opt-out lives
      only on the unmerged ambient-flip PR #3745, not on main; #3789 makes it
      unnecessary (all counter-cache tests pass under `partial_inserts = true`),
      so #3745 should drop the opt-out hunk when it rebases.
- [x] No regression elsewhere. All 104 counter-cache tests pass under both
      ambients; no test names changed (test:compare delta 0); test-only change
      (api:compare delta 0).
