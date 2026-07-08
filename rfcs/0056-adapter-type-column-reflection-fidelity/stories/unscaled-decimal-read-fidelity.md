---
title: "unscaled-decimal-read-fidelity"
status: done
updated: 2026-07-08
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 68
pr: 4757
claim: "2026-07-07T21:43:22Z"
assignee: "unscaled-decimal-read-fidelity"
blocked-by: null
---

## Context

`migration_test.rb#test_add_table_with_decimals`
(vendor/rails activerecord/test/cases/migration_test.rb:464-521) creates
`big_numbers` with a `value_of_e` column declared as bare `:decimal` (no
precision/scale) and asserts its persisted value's per-adapter type:

- PostgreSQL keeps full precision (`BigDecimal("2.7182818284590452353602875")`).
- SQLite stores a float, read back as a `BigDecimal` within 1e-14.
- Other adapters (MySQL) truncate to the SQL-standard `Integer` `2`.

trails diverges when reading an unscaled/scale-0 decimal column **without** an
explicit model attribute override: the value comes back as a plain JS `number`,
lossily for large integers (e.g. `2**62` → `4611686018427388000`) and truncated
for fractional values (SQLite `value_of_e` → `2`, not a `BigDecimal` float). The
canonical `models/numeric_data.rb` port works around this by declaring such
columns `:big_integer`; `models/big_number.rb` deliberately does not, which is
why the migration-test port asserts only non-nil for `value_of_e` and uses a
`:big_integer` override for `world_population`.

Surfaced by the `converge-migration-test-columnshash-stubs` port
(`packages/activerecord/src/migration.test.ts`, "add table with decimals").

## Acceptance criteria

- [ ] An unscaled (no precision/scale) or scale-0 decimal column read back
      without a model attribute override returns a Rails-faithful value:
      `BigDecimal` (PG full precision; SQLite float) / arbitrary-precision
      integer where Rails returns `Integer`, with no JS-number precision loss.
- [ ] Restore the per-adapter `value_of_e` and bare `world_population`
      assertions in `migration.test.ts` "add table with decimals" to match
      Rails (drop the `:big_integer` workaround / non-nil-only assertion).
