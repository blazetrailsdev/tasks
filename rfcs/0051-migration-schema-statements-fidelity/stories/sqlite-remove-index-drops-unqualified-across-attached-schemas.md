---
title: "SQLite removeIndex emits an unqualified DROP INDEX, so an ATTACHed-schema drop can hit the wrong catalog"
status: claimed
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-08-21T13:50:33Z"
assignee: "retire-collection-proxy-append-bang-and-wire-inverse-target"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#remove_index` emits `DROP INDEX #{quote_column_name(index_name)}`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:283-289`),
mirrored at
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` in
`removeIndex`. The emitted name is always bare.

PR #6810 made `SQLite3Adapter#indexName` derive the default index name from the
BARE table (`_splitTableName`), so `addIndex("aux.customers", ["name"])` now
creates `"aux"."index_customers_on_name"` — the qualifier moved onto the INDEX
name by `SQLite3::SchemaCreation#visit_CreateIndexDefinition`
(`packages/activerecord/src/connection-adapters/sqlite3/schema-creation.ts`).
`removeIndex("aux.customers", ["name"])` then drops it successfully, which is
why the round-trip test in
`packages/activerecord/src/connection-adapters/sqlite3-introspection.test.ts`
("addIndex derives the default index name from the bare qualified table")
passes.

It passes because SQLite resolves an unqualified `DROP INDEX` name across every
attached database in turn (main, temp, then each ATTACHed schema in attach
order) — not because trails asks for the right catalog. Two ATTACHed databases
carrying the same index name therefore have `removeIndex("aux.customers", ...)`
drop whichever SQLite reaches first, which need not be `aux`. `addIndex` on the
same pair is unambiguous, so the create/drop pair is asymmetric.

Rails has no ATTACHed-schema notion at all, so there is no Ruby `remove_index`
behaviour to mirror here; the qualifier handling is the trails-only extension
already ratified for `visit_CreateIndexDefinition` and `indexName` (CLAUDE.md
does not cover it, the two call sites do).

## Converged shape

`removeIndex` splits the table with `_splitTableName` exactly as `indexName`,
`columns`, `foreignKeys` and `primaryKeys` do, and emits
`DROP INDEX "aux"."index_customers_on_name"` when the table is qualified,
falling through to the bare Rails emission when it is not — the same
qualified/unqualified fork `visit_CreateIndexDefinition` already takes.

Check `indexNameExists` / `indexExists` at the same time: they read
`indexes(tableName)`, which does route the PRAGMA to the right catalog, so they
are probably already correct — confirm rather than assume.

## Acceptance criteria

- [ ] `removeIndex("aux.customers", ["name"])` emits a schema-qualified
      `DROP INDEX "aux"."index_customers_on_name"`.
- [ ] A test attaches TWO databases carrying an identically-named index and
      shows `removeIndex` drops the one in the named schema, leaving the other
      intact — failing on the current bare emission.
- [ ] The unqualified path emits exactly what `sqlite3_adapter.rb:283-289`
      does, unchanged.
