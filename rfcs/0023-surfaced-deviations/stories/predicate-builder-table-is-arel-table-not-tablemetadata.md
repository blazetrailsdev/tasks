---
title: "PredicateBuilder holds an Arel Table plus a side _tableContext, not a TableMetadata"
status: ready
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `PredicateBuilder#initialize(table)` takes a **`TableMetadata`** and stores
it as `@table` (`predicate_builder.rb:12-13`); every `table.` call in the class
(`associated_table`, `type`, `has_column?`) is a TableMetadata call.

trails takes an Arel `Table` (`relation/predicate-builder.ts:27,44` —
`private _table: Table`) and carries the TableMetadata _separately_ as
`_tableContext` (`:42`), set via `setTableContext` / `with`. So a builder can
exist with a table but no metadata.

Story `predicate-builder-base-not-tablemetadata-backed` (done, PR #4846) fixed the
**entry point** (`Base.predicateBuilder` is now TableMetadata-backed). This is the
remaining half: the class's own internal shape.

Surfaced by PR #4889. Because `_tableContext` can be absent, `resolveArelAttribute`
needs a no-context fallback that hand-builds a `TypeCaster::Connection`
(`predicate-builder.ts`, the branch after the `ctx?.associatedTable` check) purely
to avoid a caster-less table. Rails needs no such branch: `associated_table` is
always reachable and never yields a caster-less table
(`table_metadata.rb:43-48`). `buildBindAttribute` has the same split — it reads
`this.table.typeForAttribute` where Rails reads `table.type(column_name)` on the
metadata (`predicate_builder.rb:20-22`).

## Acceptance criteria

- [ ] `PredicateBuilder`'s `table` is a `TableMetadata`, matching
      `predicate_builder.rb:12-13`; `_tableContext` is gone.
- [ ] `resolveArelAttribute`'s no-context fallback is deleted — `associatedTable`
      is always reachable, as in Rails.
- [ ] `buildBindAttribute` reads the metadata (`table.type(name)`,
      `predicate_builder.rb:20-22`).
- [ ] Callers constructing `new PredicateBuilder(arelTable)` are updated
      (`table-metadata.ts` `predicateBuilder`, `core.ts`, tests).
- [ ] No test name changes. api:compare / test:compare delta non-negative.
