---
title: "add_index cannot express a schema-qualified index name, so copy_table_indexes keeps one hand-built arm"
status: done
updated: 2026-08-10
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6338
claim: "2026-08-10T14:33:26Z"
assignee: "date-seat-drops-nth-and-spells-the-residue-year"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6315 (`sqlite-copy-table-indexes-should-call-add-index`), which
routed `SQLite3Adapter#copyTableIndexes` through `this.addIndex` for every
destination Rails can name. One arm still hand-builds the statement: a
schema-qualified destination (`aux.posts`).

Rails' `copy_table_indexes` calls `add_index` unconditionally
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:674`,
options built at `:668-673`). It can, because Rails has no ATTACHed-schema
notion here at all. trails does: `_splitTableName` exists on this adapter and
`alterTable` / `copyTable` are reached with `aux.posts` names.

SQLite puts the schema on the INDEX name, not on the table it indexes —
`CREATE INDEX aux.by_name ON widgets (…)` — and qualifying the table instead is
a syntax error. `addIndex` → `buildCreateIndexDefinition` → `SchemaCreation`
quotes the table name (`visitIndexDefinition`), so it cannot currently express
a qualified index name against a bare table, and that one branch assembles the
`CREATE [UNIQUE] INDEX … ON … (…) [WHERE …]` string locally and hands it to
`execute`. It is recorded there as a branch-local `MISSING RAILS CALL` comment;
the method-level `@missingRailsCall` tag had to go, because `parity:api:calls` fails a
tag as STALE once the method makes the call at all (verified on #6315).

## Converged shape

Teach the index path the schema-qualified index name so the single `addIndex`
call covers both arms:

- `IndexDefinition` (or `SQLite3::SchemaCreation#visitIndexDefinition`) carries
  the schema, split off with the adapter's existing `_splitTableName`, and emits
  `CREATE INDEX "aux"."by_name" ON "widgets" (…)` — schema on the index, bare
  table.
- `copyTableIndexes` then loses its local assembly entirely and its
  branch-local missing-call comment with it, leaving one unconditional
  `addIndex(to, columns, options)` exactly as `sqlite3_adapter.rb:674` has it.

## Acceptance criteria

- [ ] `copyTableIndexes` has a single `addIndex` call and no hand-built
      `CREATE INDEX` string, for qualified and unqualified destinations alike.
- [ ] The branch-local `MISSING RAILS CALL (add_index, sqlite3_adapter.rb:674)`
      comment is deleted, not reworded, and no `call-mismatches-exclude` row is
      added.
- [ ] `adapters/sqlite3/copy-table.trails.test.ts` stays green, including the
      partial-index `WHERE`, expression-index and column-order cases, and an
      ATTACHed-schema case pins the qualified emission.
- [ ] `pnpm parity:api:calls` green.
