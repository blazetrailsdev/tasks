---
title: "SchemaDumper emitTable routes virtual columns through PG prepareColumnOptions"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). `SchemaDumper.dumpTableSchema`'s
legacy `emitTable` column-rendering path bypasses the PG dialect dumper's
`prepareColumnOptions` (`connection-adapters/postgresql/schema-dumper.ts:21`),
which is what emits `as:`/`stored:` for generated/virtual columns. As a result
a stored generated column is dumped as
`t.string("upper_name", { default: () => "upper((name)::text)" })` instead of
`t.virtual "upper_name", type: "string", as: "...", stored: true`. The column's
generation expression is also not carried through the abstract dumper's
`ColumnInfo` mapping (`schema-dumper.ts:477` maps `virtual` but not the `as`
expression).

Blocks `adapters/postgresql/virtual-column.test.ts` test `schema dumping`
(Rails `virtual_column_test.rb` `test_schema_dumping`), which asserts
`t.virtual` emission for `upper_name`, `name_length`, `name_octet_length`,
`column2`.

## Acceptance criteria

- [ ] `dumpTableSchema` routes virtual/generated columns through the PG dialect
      `prepareColumnOptions` (emitting `type:`/`as:`/`stored: true`).
- [ ] Generation expression carried through the dumper column mapping.
- [ ] Un-skip `schema dumping` in `virtual-column.test.ts`; it passes under PG.
