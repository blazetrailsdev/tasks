---
title: "trails-tsc: --schema accepts more than one file, for a multi-database app"
status: done
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: trails#8954
claim: "2026-10-15T20:59:39Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc --schema <path>` reads exactly one file:
`loadSchemaColumns` (`packages/activerecord-cli/src/tsc-wrapper/cli.ts`) `break`s
on the first `--schema` it sees, and a second one is silently ignored (the run
exits 0 and types only the first file's tables).

A multi-database application has one schema file per database — trailmap has
`db/schema.ts` (SQLite, task domain) and `db/hub_schema.ts` (Postgres, hub),
exactly the layout `trails db:schema:dump` writes for a multi-database
`config/database`. Today such an app can type the models of one database or
the other, never both in one run. The workaround used to measure adoption was
concatenating the files into a third one, which is not something to commit.

The virtualizer itself needs no change: `schemaColumnsByTable` is one flat
`{ table: { column: … } }` record and tables are looked up by name, so the
models of each database resolve against a merged record without knowing which
database they belong to. trailmap's 14 tables do not collide.

## Acceptance criteria

- `--schema` may be given more than once (`--schema a.ts --schema b.ts`, and
  the `=` form); the parsed tables are merged, in normal, `--build` and
  `--print-virtualized` modes.
- A table defined in two of the files is an error naming the table and both
  files, not a last-one-wins merge: two databases may legitimately hold a
  same-named table with different columns, and typing a model against the
  wrong one is the silent failure to refuse. (Per-model schema selection is out
  of scope until an app actually has the collision.)
- `--help` documents the repetition.
- Tests in `cli.test.ts`: two files merge; a duplicate table is refused.
