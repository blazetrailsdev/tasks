---
title: "sqlForInsert peeks the schema cache's primary keys; Rails calls primary_key(table_ref)"
status: closed
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: the schema-cache peek never shipped; trails#8838 reverted sql_for_insert to its awaited primary_key call on the owner's ruling"
---

## Context

Rails' `sql_for_insert`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:702-717`)
infers a missing `pk` with `primary_key(table_ref)` (`:706`), which is
`SchemaStatements#primary_key` (`abstract/schema_statements.rb:145-149`): a
query, run in line.

trails#8838 made `sqlForInsert` synchronous. `primaryKey` is awaited in trails,
so the body reads `this.schemaCache.getCachedPrimaryKeys(tableRef)` and
`execInsert` awaits `schemaCache.primaryKeys(tableRef)` first. The blocker is
that the table is only known once the INSERT statement is in hand, so there is
no earlier step that can warm it, and a cached answer can be stale where Rails
queries every time.

The deviation is receipted in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`:
`@missingRailsCall primary_key` on `sqlForInsert`, and `@inventedArm if` /
`@inventedArm primaryKeys` on `execInsert`, all naming this story.

## Acceptance criteria

- [ ] `sqlForInsert` calls `primaryKey(tableRef)` as `database_statements.rb:706`
      does, or the repo owner rules the schema-cache peek permanent.
- [ ] `execInsert` carries no warm step Rails does not have, or its receipts
      are `PERMANENT` under that ruling.
- [ ] A raw `connection.insert("INSERT INTO t ...")` with no `pk` still returns
      the inserted id on PostgreSQL and SQLite.
