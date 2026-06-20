---
title: "Test-schema column defaults missing vs schema.rb under partial_inserts=true"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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

Prerequisite for flipping the AR-test ambient to match Rails' test suite.

## Acceptance criteria

- [ ] Enumerate ported tests whose model declares a column default the test
      schema omits (start: counter-cache.test.ts).
- [ ] Align the canonical TEST_SCHEMA column defaults with schema.rb (and/or
      propagate model defaults to the created DB column) so partial inserts
      read the Rails value.
- [ ] Affected tests pass under `partial_inserts = true`; no regression under
      `false`.
