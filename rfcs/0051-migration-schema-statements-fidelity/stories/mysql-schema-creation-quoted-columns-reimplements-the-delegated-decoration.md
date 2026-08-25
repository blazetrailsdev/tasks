---
title: "mysql-schema-creation-quoted-columns-reimplements-the-delegated-decoration"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6282
claim: "2026-08-09T15:40:10Z"
assignee: "mysql-schema-creation-quoted-columns-reimplements-the-delegated-decoration"
blocked-by: null
closed-reason: null
---

## Context

Rails' `MySQL::SchemaCreation` has **no** `quoted_columns` override
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_creation.rb`
— the file defines `visit_DropForeignKey`, `visit_DropCheckConstraint`,
`visit_AddColumnDefinition`, `visit_ChangeColumnDefinition`,
`visit_IndexDefinition:42-54`, `add_table_options!`, `add_column_options!`,
`index_in_create` and nothing else). The base's `quoted_columns`
(`abstract/schema_creation.rb:133-135`) calls the **delegated**
`quoted_columns_for_index`, which is the connection's
(`abstract/schema_statements.rb:1510-1515`) and does the whole decoration:
`add_options_for_index_columns` (`:1639-1645`) folds in the sort order behind
`supports_index_sort_order?` (`:1640`), and MySQL adds sub-part lengths on the
adapter side.

trails instead overrides `quotedColumns` on `MySQL::SchemaCreation`
(`packages/activerecord/src/connection-adapters/mysql/schema-creation.ts:265-280`)
and re-implements that decoration inside the visitor: it builds the quoted map
itself, calls the module-level `addOptionsForIndexColumns`
(`mysql/schema-statements.ts:342`) and reads `this.supportsIndexSortOrder()`
directly.

That reimplementation is the only reason `supportsIndexSortOrder` appears on
`SchemaCreationConn` at all — surfaced in review of PR #6247, where the probe
had to be threaded to the connection even though Rails never names it in a
visitor. The call site carries a JSDoc pointing at this story.

Blocker to check first: `AbstractMysqlAdapter` in trails does **not** override
`addOptionsForIndexColumns` (only PostgreSQL does,
`postgresql-adapter.ts:4278`), so deleting the visitor override as-is would
drop MySQL's sub-part index lengths. Rails' `add_index_length` lives on the
adapter (`abstract_mysql_adapter.rb`), which is where the port belongs.

## Acceptance criteria

- [ ] `MySQL::SchemaCreation` has no `quotedColumns` override — the base's
      delegation to the connection's `quotedColumnsForIndex` is the only path.
- [ ] MySQL's sub-part index lengths are applied on the adapter, where Rails
      puts them, not in the visitor.
- [ ] `supportsIndexSortOrder` is removed from `SchemaCreationConn` and from
      `SchemaCreation` (no visitor names it), matching
      `abstract/schema_creation.rb:16-21`'s delegate list.
- [ ] Index SQL with `length:` / `order:` is unchanged on MySQL/MariaDB.
