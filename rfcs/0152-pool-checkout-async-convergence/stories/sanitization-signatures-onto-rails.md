---
title: "Sanitization: sanitize_sql_hash_for_assignment calls type_for_attribute; sanitize_sql_array takes ary"
status: done
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 100
pr: trails#8049
claim: "2026-09-24T18:37:31Z"
assignee: "sanitization-signatures-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8030 (sanitization-with-connection-per-branch). `sanitizeSqlHashForAssignment`
(`packages/activerecord/src/sanitization.ts`) now quotes inside `withConnectionSync`, but its
signature and body still diverge from `vendor/rails/activerecord/lib/active_record/sanitization.rb:107-115`:

- Rails takes `(attrs, table)` and calls `type_for_attribute(attr)` on the class itself (`:110`), then
  `value = type.serialize(type.cast(value))` unconditionally. trails takes a third optional
  `typeForAttribute` callback, skips the cast when it is absent, and guards `type.cast` / `type.serialize`
  individually. `type_for_attribute` never returns nil in Rails (it falls back to the default type).
- Rails always emits `c.quote_table_name_for_assignment(table, attr)`. trails adds an invented
  `table ? … : c.quoteColumnName(attr)` arm.
- `sanitizeSqlArray` takes `(statement, ...values)` where Rails' `sanitize_sql_array(ary)` (`:164`)
  takes the whole array and destructures `statement, *values = ary`. Its `%` branch hand-emulates
  Ruby `String#%` with a regex over `%s/%d/%i`, including an invented `PreparedStatementInvalid`
  message for a bad `%d`.

## Acceptance criteria

- `sanitizeSqlHashForAssignment(attrs, table)` calls `this.typeForAttribute(attr)` and
  `type.serialize(type.cast(value))` as `:110-111` does, and always uses `quoteTableNameForAssignment`.
  Callers that passed the callback are updated.
- `sanitizeSqlArray` takes `ary` as Rails does, with every caller updated (`sanitizeSql`, `sanitizeSqlForOrder`, tests).
- The `%` branch uses a ruby-compat `String#%` port if one exists, else file one in 0154, and raises the error Ruby raises.
- `sanitize.test.ts`, `sanitize.trails.test.ts` and `sanitization-quoter.trails.test.ts` stay green on all three adapters.
