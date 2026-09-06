---
title: "The base schema dumper duck-types PostgreSQL::Column#is_enum? in its emission loop"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaDumper#table`'s DSL-emission loop duck-types a PostgreSQL-only predicate
from the base dumper (packages/activerecord/src/schema-dumper.ts:503):

```ts
} else if ((column as Partial<PostgreSQLColumn>).isEnum?.() === true && type === "enum") {
```

`isEnum()` is declared only on `PostgreSQL::Column`
(`connection-adapters/postgresql/column.ts:88`, mirroring
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/column.rb:43-45`);
the base `ConnectionAdapters::Column` has no such method, so on every other
adapter the optional call answers `undefined` and the arm is dead. The cast plus
`?.()` is what keeps that from being a type error.

Rails has no counterpart to any of it. Its `table` loop is
`type, colspec = column_spec(column)` followed by a two-way `Symbol` /
non-Symbol print (`schema_dumper.rb:197-202`); the decision about how an enum
column renders lives in `PostgreSQL::SchemaDumper#schema_type`
(`postgresql/schema_dumper.rb:88-96`), on the adapter that knows about enums,
not in a cross-adapter duck-type in the base class. `t.enum` / `_isDslHelper`
are the trails DSL emitter, which is why this leaked upward.

This was introduced in #7571 only as the spelling of a pre-existing
`(column as { isEnum?: boolean }).isEnum` read that the retired `ColumnInfo`
projection used to populate; the duck-type itself predates that PR.

## Converged shape

The base loop asks `columnSpec` for the type and prints, with no adapter-
specific predicate. Whatever the enum arm needs travels down from
`PostgreSQL::SchemaDumper`, which already overrides `schemaType` and
`prepareColumnOptions` and already calls `column.isEnum()` at
`postgresql/schema-dumper.ts:24,28` — so the base dumper stops importing
`postgresql/column.js` at all.

## Acceptance criteria

- [ ] `schema-dumper.ts` has no `PostgreSQLColumn` import and no adapter-
      specific predicate in the emission loop.
- [ ] PG enum columns still round-trip (`adapters/postgresql/enum.test.ts`).
- [ ] Green on all three lanes.
