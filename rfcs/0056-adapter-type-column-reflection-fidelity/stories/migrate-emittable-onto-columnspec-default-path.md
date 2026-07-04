---
title: "Route dumper emitTable default emission through the columnSpec/schemaDefault cast-type path"
status: ready
updated: 2026-07-04
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The base `SchemaDumper` (`packages/activerecord/src/schema-dumper.ts`) has two
default-emission paths where Rails has one:

1. The modern, Rails-faithful path: `schemaDefault`
   (`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:200`),
   reached via `columnSpec` / `prepareColumnOptions`. It operates on a real
   `Column`, calls `adapter.lookupCastTypeFromColumn(column)` →
   `type.deserialize(column.default)` → `type.typeCastForSchema(...)` — a
   line-for-line match of Rails `schema_default`
   (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb:86`).

2. A legacy `emitTable` path that works off plain `ColumnInfo` objects (no
   `Column`, no adapter cast type in hand) and therefore regex-coerces the
   default itself via the trails-invented `cleanDefault`
   (`schema-dumper.ts:415`). Two callsites:
   - `schema-dumper.ts:1012` — uuid PK default in `primaryKeyTableOptions`
   - `schema-dumper.ts:1108` — the non-`columnSpec` column loop

Rails does not have a second path: its base dumper always drives column specs
through the adapter subclass's `column_spec` / `prepare_column_options`. The
legacy `emitTable` path is the trails deviation, and it is what forces
`cleanDefault` / `cleanRawPgExpression` to exist.

This story does the engineering: give the `emitTable` callsites a real `Column`

- adapter cast type so they route default emission through `schemaDefault`
  instead of `cleanDefault`. It is the prerequisite for deleting the helpers
  (tracked separately in
  `converge-dumper-default-emission-delete-cleandefault`, which depends on this).

Do NOT touch `splitPgDefault` (`postgresql-adapter.ts:4916`) — that is the
correct introspection-time `extract_value_from_default` port and is unrelated to
the dump-time path.

## Acceptance criteria

- The base dumper's `emitTable` default-emission callsites (`schema-dumper.ts:1012`,
  `:1108`) obtain a real `Column` (or an equivalent object accepted by
  `lookupCastTypeFromColumn`) and route through the existing `schemaDefault`
  path (`type.deserialize` + `typeCastForSchema`), matching how `columnSpec`
  already does it.
- No behavior change in dump output: PG/MySQL/SQLite default-bearing columns
  (cast literals, money multi-cast, uuid PK defaults, interval/Duration,
  bit-string leading-zero literals) emit identically. Verify via the existing
  Rails-mirrored `schema-dumper.test.ts` cases across adapters.
- `cleanDefault` / `cleanRawPgExpression` become unreachable from the real
  (introspected) dump path — but leave the actual deletion and `.trails.test.ts`
  cleanup to the dependent delete story; this story only removes the callsite
  dependency.
- `splitPgDefault` untouched.

## Notes

- If finishing the `emitTable → columnSpec` unification is larger than one
  ~500-LOC PR, ship the portion that unblocks the two default callsites and
  register the remainder as a follow-up story rather than fanning out PRs.
