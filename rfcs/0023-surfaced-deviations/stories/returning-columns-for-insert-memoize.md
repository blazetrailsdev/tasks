---
title: "Memoize _returningColumnsForInsert per-class (Rails ||=)"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in review of PR #4111 (live-create-path-uses-insert-record). Rails
memoizes `@_returning_columns_for_insert` per-class until
`reset_column_information` clears it (vendored Rails v8.0.2
`activerecord/lib/active_record/model_schema.rb:437`, the `||=` block; reset at
`model_schema.rb:554` in `reload_schema_from_cache`). trails'
`_returningColumnsForInsert` (`packages/activerecord/src/model-schema.ts:536`)
recomputes the `autoPopulated` filter over `columns()` on every call.

After PR #4111, `Base#_performInsert` (`packages/activerecord/src/base.ts`,
the `_pendingOperation` block) calls `_returningColumnsForInsert` once per
INSERT and then `ctor.columns()` again for the `autoIncColumn` search. `columns()`
itself is cached via `_columns`, so there is no extra DB round-trip, but the
auto-populated filter loop runs on every INSERT instead of once per class.

## Acceptance criteria

- [ ] `_returningColumnsForInsert` memoizes its result per-class
      (`_returningColumnsForInsertCache`), mirroring Rails' `||=`.
- [ ] `resetColumnInformation` clears the cache on both the STI-subclass branch
      (the delete-key loop) and the base branch — verify a toggled schema
      (e.g. `emulate_booleans` / `reset_column_information`) recomputes it.
- [ ] api:compare and test:compare delta non-negative; lint + typecheck clean.

## Implementation note (already prototyped locally, not merged)

Add `_returningColumnsForInsertCache?: string[]` to `SchemaHost`; return it
early when set; assign on both return paths (`return (this._returningColumnsForInsertCache = ...)`);
add `"_returningColumnsForInsertCache"` to the STI delete-key list and
`this._returningColumnsForInsertCache = undefined` in the base reset path of
`resetColumnInformation`.
