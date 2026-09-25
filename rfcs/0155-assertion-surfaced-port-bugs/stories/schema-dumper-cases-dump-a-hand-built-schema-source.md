---
title: "Dump the canonical pool in the last two hand-built-SchemaSource schema dumper cases"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8089
claim: "2026-09-25T15:11:37Z"
assignee: "schema-dumper-cases-dump-a-hand-built-schema-source"
blocked-by: null
closed-reason: null
---

## Context

Two `SchemaDumperTest` cases in `packages/activerecord/src/schema-dumper.test.ts`
still dump a hand-built `SchemaSource` literal or a hand-built pool instead of
the canonical connection Rails dumps. trails#7859 converted the rest of the file
(the foreign-key cases, the regexp-ignored-table case, both table-name
prefix/suffix cases) onto the real dump; these two are what is left.

**`schema dump with table name prefix and ignoring tables`.** Rails
(`activerecord/test/cases/schema_dumper_test.rb:582-610`) runs a real migration —
`Class.new(ActiveRecord::Migration::Current)` whose `change` creates `cats` and
`omg_cats` — under `ActiveRecord::Base.table_name_prefix = "omg_"` and
`ActiveRecord::SchemaDumper.ignore_tables = ["cats"]`, then dumps
`ActiveRecord::SchemaDumper.dump(ActiveRecord::Base.connection_pool, stream).string`.
trails passes an object literal whose `tables()` returns
`["omg_cats", "omg_omg_cats"]` with a stub `adapter`, so the case exercises
`removePrefixAndSuffix` and `isIgnored` but never the dumper's table or column
paths.

**`schema dump include migration version`.** Rails (`:45-48`) is
`output = standard_dump` plus one `assert_match` on the
`ActiveRecord::Schema[<version>].define` header. trails constructs its own
`SchemaMigration`, creates a version, and dumps through a separately imported
top-level `SchemaDumper`, which is a second setup path for the same claim.

Assertion parity is already 0/0/0 for both — this is setup fidelity, not
assertion fidelity, so it is not caught by `parity:test --assertions`.

## Converged shape

- `schema dump with table name prefix and ignoring tables`: create `omg_cats`
  and `omg_omg_cats` through a migration, the way the file's already-ported
  `CreateCatMigration` does for the prefix/suffix cases, set
  `Base.tableNamePrefix` and `SchemaDumper.ignoreTables`, and dump the canonical
  pool.
- `schema dump include migration version`: use the file's `standardDump()`
  helper against the canonical pool and drop the bespoke `SchemaMigration` and
  the second dumper import.
- No new tables: both use tables the canonical schema or the migration already
  provides.

## Acceptance criteria

- Neither case constructs a `SchemaSource` object literal, and neither imports a
  second `SchemaDumper`.
- `pnpm parity:test -- --package activerecord --assertions` still reports 0
  assertion-count, 0 assertion-kind and 0 assertion-value mismatches for both
  cases.
- No test name changes.
