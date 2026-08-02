---
title: "converge-adapter-indexes-return-type"
status: claimed
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-02T03:56:53Z"
assignee: "converge-adapter-indexes-return-type"
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter`'s declaration-merged interface declares
`indexes(tableName: string): Promise<unknown[]>`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`), but the
mixed-in `SchemaStatements#indexes`
(`abstract/schema-statements.ts:1192`) returns the spelled-out row shape
`Array<{ name; columns; unique; where?; orders? }>`.

The mixin-declaration drift lint added by
`mixin-declaration-interface-can-drift-from-its-module`
(`scripts/mixin-declaration-drift.ts`) flags this, and the member carries a
`drift-ok:` waiver pointing here. Narrowing the interface to the mixin's shape
was tried and reverted: `AbstractSQLite3Adapter#indexes`
(`sqlite3-adapter.ts:2150`) and the other concrete adapters override with
`Promise<unknown[]>`, so the narrowing made every adapter unassignable to
`AbstractAdapter` (~50 typecheck errors across `trailties`, `sync-stats`, and
the AR suites).

Rails' `SchemaStatements#indexes` returns `IndexDefinition` objects
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`),
which is what the adapters should converge on.

## Acceptance criteria

- The concrete adapters' `indexes` return type is converged so the
  `AbstractAdapter` interface can declare the mixin's shape.
- The `drift-ok:` waiver on `AbstractAdapter#indexes` is deleted and
  `scripts/mixin-declaration-drift.test.ts` still passes.
