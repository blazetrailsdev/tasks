---
title: "widen-limit-offset-value-read-declarations"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6686
claim: "2026-08-18T02:31:51Z"
assignee: "invert-where-chain-trio-onto-wherechain"
blocked-by: null
closed-reason: null
---

## Context

`limit!` and `offset!` are bare assignments in Rails
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1215-1218`,
`:1231-1234`), so `limit_value` / `offset_value` hold whatever the caller passed
until `build_arel` sanitizes them (`:1757` `connection.sanitize_limit`, `:1758`
`offset_value.to_i`). PR #6602 converged `offset!` and PR #6610 converged
`limit!`; both widened the WRITE surface (`QueryMethodsHost`, `ValuesHash`,
`Relation#limit`/`#offset`, `Querying#limit`) to `number | string | null`.

Both left the READ-side declarations at `number | null`:

- `packages/activerecord/src/relation.ts` (the `Relation<T>` interface merge)
- `packages/activerecord/src/relation/calculations.ts`
- `packages/activerecord/src/relation/finder-methods.ts`

so downstream reads do raw arithmetic on a field that can now hold a string.
Ruby raises at the equivalent lines; trails mostly does not:

- `finder_methods.rb:610` `limit = [limit_value - index, limit].min` — Ruby
  raises `NoMethodError` on `String#-`. trails
  (`relation/finder-methods.ts:557`) yields `NaN`, which then reaches
  `sanitizeLimit(NaN)` and DOES raise a TypeError — different class and site.
- `relation.rb` `inspect` / `pretty_print` — `[limit_value, 11].compact.min`
  raises `ArgumentError: comparison of String with 11 failed`. trails
  (`relation.ts:1312`, `:1339`) yields `NaN` and silently renders an empty
  entry list.
- `in_batches` — `remaining = limit_value; remaining < batch_limit` raises in
  Ruby; trails (`relation/batches.ts:190`) casts `as number` and compares
  falsely.

Raised as finding 2 on the #6610 review.

## Converged shape

Widen the three read-side declarations to `number | string | null` and make each
arithmetic site raise where Ruby raises, rather than coercing to `NaN` or
casting the string away. `offsetValue`'s read-side declarations
(`finder-methods.ts:292`, `relation.ts`, `calculations.ts`) and its `toI` reads
have the identical shape and are part of the same fix.

## Acceptance criteria

- [ ] `limitValue` and `offsetValue` are declared `number | string | null`
      everywhere they are declared, with no `as number` casts papering over it.
- [ ] A non-numeric `limit("asdfadf")` / `offset("asdfadf")` reaching
      `second` / `inspect` / `prettyPrint` / `inBatches` raises, at the same
      point Rails raises.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
