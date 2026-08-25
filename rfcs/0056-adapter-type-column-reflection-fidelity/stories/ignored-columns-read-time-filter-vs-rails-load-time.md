---
title: "ignoredColumns filtered at read time in columnsHash; Rails filters at load — columns() memo leaks after reassignment"
status: done
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5140
claim: "2026-07-23T12:55:36Z"
assignee: "ignored-columns-read-time-filter-vs-rails-load-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5109. Rails filters `ignored_columns` at load time —
`load_schema!` builds `@columns_hash = columns_hash.except(*ignored_columns)`
and `ignored_columns=` triggers `reload_schema_from_cache`, so `columns`,
`columns_hash`, and `column_names` all agree
(`vendor/rails/activerecord/lib/active_record/model_schema.rb`).

trails filters at read time instead: `ModelSchema.columnsHash()`
(`packages/activerecord/src/model-schema.ts:~258-300`) applies the
`ignoredColumns` filter on every read, while `columns()`
(`model-schema.ts:~704`) memoizes `_columns` from the raw hash. Consequences:

- `columns()` leaks ignored columns after an `ignoredColumns=` reassignment
  (its `_columns` memo bypasses the read-time filter) — observed directly in
  #5109: switching `columnNames` to `columns().map(c => c.name)` failed
  base.test.ts "when assigning new ignored columns it invalidates cache for
  column names".
- `columnNames` must read `columnsHash()` keys instead of Rails' literal
  `columns.map(&:name)` shape (deviation justified at the call site,
  `model-schema.ts:~204-215`).
- Rails' `@column_names` memoization is unportable until the filter moves to
  load time.

## Acceptance criteria

- Ignored-column filtering happens at load/reset time (mirroring
  `load_schema!` + `reload_schema_from_cache`); `ignoredColumns=` invalidates
  `_columns`/`_columnsHash`.
- `columns()` after `ignoredColumns=` reassignment excludes the ignored
  column; base.test.ts ignored-columns tests unchanged and passing.
- `columnNames` becomes literal `columns().map(c => c.name)`; call-site
  deviation comment removed.
