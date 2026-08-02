---
title: "converge-adapter-indexes-return-type"
status: closed
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5865
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate: same defect (AbstractAdapter#indexes declared Promise<unknown[]> vs the mixin's IndexDefinition row shape) as adapter-indexes-return-type-index-definition-shape, claimed 70min earlier and in flight as the broader PR 5858 (+54/-72, 6 files, also drops the Migration#addReference cast) vs this story's PR 5865 (+32/-9, 3 files). Verified on origin/main: one defect, one site (abstract-adapter.ts indexes decl, abstract/schema-statements.ts:1219 impl). Fold the unique AC — delete the drift-ok waiver on AbstractAdapter#indexes and keep scripts/mixin-declaration-drift.test.ts green — into 5858; close 5865."
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
