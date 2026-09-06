---
title: "schema-dumpers-take-columns-not-columninfo"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7571
claim: "2026-09-06T18:18:16Z"
assignee: "schema-dumpers-take-columns-not-columninfo"
blocked-by: null
closed-reason: null
---

## Context

Rails' schema dumpers are handed `ConnectionAdapters::Column` objects and call
their predicates directly — `column.serial?` at
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_dumper.rb`
(`schema_type`, `schema_expression`, `explicit_primary_key_default?`) and
`column.virtual?` in the abstract dumper.

trails interposes a `ColumnInfo` struct
(`packages/activerecord/src/schema-dumper.ts:20-44`) that projects a Column into
plain data fields, and the projection at `:180-222` is the only producer of it —
so every dumper method receives a ColumnInfo at runtime while its own unit tests
(`connection-adapters/postgresql/schema-dumper.trails.test.ts`) hand it real
`Column` instances, as Rails does.

The two shapes disagree for a predicate. `_isVirtual`
(`connection-adapters/postgresql/schema-dumper.ts`) already duck-types around
that, and PR #7243 — which converged PG `Column`'s `isSerial` / `isIdentity` /
`isEnum` from getters to methods, matching `postgresql/column.rb:16-22,43-45` —
had to add `_isSerial` and `_isEnum` beside it for the same reason: a method
read as a field is truthy for every column.

`ColumnInfo` has no Rails counterpart, and these three helpers exist only to
bridge it.

## Acceptance criteria

- [ ] The PG and abstract schema dumpers take `Column` objects, as Rails' do,
      and call `isSerial()` / `isEnum()` / `isVirtual()` directly.
- [ ] `_isSerial`, `_isEnum` and `_isVirtual` are deleted from
      `connection-adapters/postgresql/schema-dumper.ts`.
- [ ] `ColumnInfo` is retired, or reduced to the boundary that genuinely has no
      Column to hand (state which, with the file:line).
- [ ] Green on all three lanes; `pnpm parity:api:extra --package activerecord`
      does not grow.
