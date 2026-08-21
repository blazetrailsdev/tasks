---
title: "sqlite-default-index-name-embeds-the-schema-qualifier"
status: in-progress
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6810
claim: "2026-08-21T11:39:15Z"
assignee: "measure-adapter-specific-arm-saving-on-mariadb"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#addIndex("aux.customers", ["name"])` with no explicit `name:`
raises `SqliteError: near ".": syntax error`. `index_name`
(`abstract/schema_statements.rb`, `"index_#{table_name}_on_#{...}"`) embeds the
table name verbatim, so a schema-qualified table produces
`index_aux.customers_on_name` — an identifier with a dot in it, which the
CREATE INDEX emission then reads as a schema qualifier.

Surfaced in the PR for `sqlite-add-index-expresses-schema-qualified-index-name`,
which taught `SQLite3::SchemaCreation#visit_CreateIndexDefinition` to put an
ATTACHed schema on the INDEX name
(`packages/activerecord/src/connection-adapters/sqlite3/schema-creation.ts`).
That covers `copy_table_indexes`, which always passes an explicit `name:`
(`sqlite3_adapter.rb:668-673`); the DEFAULT-name path is still broken, and the
ATTACHed-schema case in
`packages/activerecord/src/adapters/sqlite3/copy-table.trails.test.ts` has to
pass `{ name: "index_customers_on_name" }` to get past it.

Rails has no ATTACHed-schema notion here, so there is no Ruby counterpart to
mirror — the fix is to derive the default name from the BARE table (the
adapter's `_splitTableName`), matching what every other qualified path in this
adapter already does (`columns`, `foreignKeys`, `primaryKeys`).

## Acceptance criteria

- [ ] `addIndex("aux.customers", ["name"])` emits
      `CREATE INDEX "aux"."index_customers_on_name" ON "customers" ("name")`.
- [ ] `removeIndex` / `indexNameExists` agree on the same derived name.
- [ ] The copy-table ATTACHed-schema test drops its explicit `name:`.
