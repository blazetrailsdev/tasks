---
title: "Route dumper default emission through cast-type schemaDefault; delete cleanDefault/cleanRawPgExpression"
status: draft
updated: 2026-07-04
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps:
  - migrate-emittable-onto-columnspec-default-path
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The schema dumper carries two trails-invented exported helpers with no
Rails-function analog: `cleanDefault` and `cleanRawPgExpression`
(`packages/activerecord/src/schema-dumper.ts:415` and `:385`). They regex-parse
a column default at **dump time** — stripping PG cast chains
(`'happy'::mood`, `(150.55)::numeric::money`) and coercing `"true"→true`,
`"42"→42`, `Duration→iso8601`.

Rails has no such function. Its `schema_default`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb:86`)
does `type.deserialize(column.default)` then `type.type_cast_for_schema(default)`
— the cast type owns the coercion. The raw catalog-string parsing happens
earlier, at introspection, in `extract_value_from_default`
(`postgresql_adapter.rb:769`).

trails **already** has the Rails-faithful dump path: `schemaDefault`
(`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:200`)
is a line-for-line match — `adapter.lookupCastTypeFromColumn(column)` →
`type.deserialize` → `type.typeCastForSchema`. It does **not** call
`cleanDefault`. And the introspection-time cast-stripping is already owned by
`splitPgDefault` (`postgresql-adapter.ts:4916`), the correct
`extract_value_from_default` port, which deliberately keeps the literal an
undeserialized raw string and defers deserialization to `Attribute.from_database`
(`postgresql-adapter.ts:4368`, `:4946`).

So `splitPgDefault` **cannot** subsume the helpers (opposite side of the Column
boundary; must NOT coerce), and the helpers are already dead on the modern path.
`cleanDefault` survives only at two **legacy** `emitTable`-path callsites that
work off plain `ColumnInfo` without a cast type in hand:

- `schema-dumper.ts:1012` — uuid PK default in `primaryKeyTableOptions`
- `schema-dumper.ts:1108` — the non-`columnSpec` column loop

`cleanRawPgExpression`'s `::`-stripping branch only ever fires for
mock/non-introspected sources (the `.trails.test.ts` hand-built
`{default:"'happy'::mood"}` objects) — on the real PG path `splitPgDefault`
already stripped the cast before the dumper sees `column.default`. This is the
duplication flagged by the NOTE at `postgresql-adapter.ts:4936`.

## Acceptance criteria

- Route the two legacy callsites (`schema-dumper.ts:1012`, `:1108`) through the
  already-Rails-faithful `schemaDefault` path (`type.deserialize` +
  `typeCastForSchema` via `lookupCastTypeFromColumn`) instead of `cleanDefault`.
  The prerequisite work is giving those `emitTable` sites a real `Column` +
  adapter cast type (i.e. finishing the migration of `emitTable` onto the
  `columnSpec` path) — do NOT touch `splitPgDefault`.
- Delete `cleanDefault` and `cleanRawPgExpression` from `schema-dumper.ts` once
  the legacy callsites and mocks no longer reference them.
- Remove the now-dead `.trails.test.ts` cases that exercised those two helpers
  (`cleanDefault` / `cleanRawPgExpression` unit cases); keep the DSL round-trip
  and adapter-introspection cases that still map to real behavior.
- `splitPgDefault` stays put — it is the correct `extract_value_from_default`
  port and owns the introspection-time, defer-deserialization contract. Its
  `:4936` NOTE about mirroring `cleanRawPgExpression` can be dropped once the
  latter is gone.
- Dump output for PG default-bearing columns (casts, money multi-cast, uuid PK
  defaults, interval/Duration, bit-string leading-zero literals) is unchanged —
  verify via the existing Rails-mirrored `schema-dumper.test.ts` cases.
