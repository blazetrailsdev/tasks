---
title: "virtual-type-no-fallback-converge"
status: done
updated: 2026-07-06
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 16
pr: 4703
claim: "2026-07-06T21:08:53Z"
assignee: "virtual-type-no-fallback-converge"
blocked-by: null
---

## Context

`new_column_definition` for a `:virtual` positional type diverges from Rails in
the no-`:type` case. Rails sets `type = options[:type]` with **no fallback**, so
when `t.virtual` is used without `type:`, `type` becomes `nil` and the resolved
type is dropped:

- mysql `vendor/rails/.../mysql/schema_definitions.rb:69` — `type = options[:type]`
- pg `vendor/rails/.../postgresql/schema_definitions.rb:278` — `type = options[:type]`
- sqlite `vendor/rails/.../sqlite3/schema_definitions.rb:22` — `type = options[:type]`

trails keeps the literal positional value instead:

- `packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts:165` — `resolvedType = options.type ?? resolvedType` (keeps `"virtual"`)
- `packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:218` — `type = options.type ?? type` (keeps `"virtual"`)
- `packages/activerecord/src/connection-adapters/sqlite3/schema-definitions.ts:46` — `type = options.type ?? ("string" as ColumnType)` (defaults to `"string"`)

This divergence predates PR #3388 (that PR only swapped `as any` casts for the
now-typed `options.type` read); it was surfaced in review there.

## Acceptance criteria

- Decide whether converging to Rails' no-fallback behavior is safe (what does
  the abstract `super`/`create_column_definition` do with a nil/absent type?).
- Converge the three adapters to Rails' `type = options[:type]` semantics, OR
  document a justified deviation with a Rails-test reference showing the current
  behavior is required.
- Add/port a Rails test exercising `t.virtual` without `type:` on each adapter
  to lock in the chosen behavior.
- api:compare and test:compare delta non-negative.
