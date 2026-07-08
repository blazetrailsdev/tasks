---
title: "mysql-table-alias-length-256-and-receiver-dispatch"
status: claimed
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: "2026-07-08T19:07:39Z"
assignee: "mysql-table-alias-length-256-and-receiver-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Two related Rails-fidelity gaps in the `tableAliasLength` dispatch chain,
surfaced by Codex review on PR #4756 (which removed the duplicate
`tableAliasLength` from `SchemaStatements`, converging on DatabaseLimits).
Both PRE-DATE #4756 — MySQL already resolved to 64 on `main` — so #4756
correctly left them untouched (its acceptance criteria mandated "no behavior
change; all still resolve to 64 today"). This story converges them.

1. **MySQL alias length should be 256, not 64.** Rails' MySQL
   `SchemaStatements#table_alias_length` returns a hardcoded `256`
   (vendor/rails/activerecord/lib/active*record/connection_adapters/mysql/schema_statements.rb:135,
   citing <https://dev.mysql.com/doc/refman/en/identifiers.html>), NOT
   `max_identifier_length` (which is 64). trails has no override — the
   mysql host interface only \_declares* `tableAliasLength(): number`
   (packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:160),
   so MySQL aliases lock to the abstract 64. Add a concrete
   `tableAliasLength(): 256` on the MySQL adapter and wire it via the mixin.

2. **DatabaseLimits.tableAliasLength must dispatch to the receiver's
   maxIdentifierLength.** Rails' `DatabaseLimits#table_alias_length` calls the
   receiver's `max_identifier_length`
   (vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_limits.rb:15-17).
   trails' `tableAliasLength()`
   (packages/activerecord/src/connection-adapters/abstract/database-limits.ts:15-17)
   calls the module-level `maxIdentifierLength()` free function, so an adapter
   overriding `maxIdentifierLength` would NOT flow through to
   `tableAliasLength`. Convert to receiver-dispatch (`this.maxIdentifierLength()`)
   so overrides propagate.

## Acceptance criteria

- [ ] MySQL adapter's `tableAliasLength()` returns 256 (test asserting
      `mysqlAdapter.tableAliasFor(<>256 chars>)` truncates at 256), matching
      mysql/schema_statements.rb:135.
- [ ] `DatabaseLimits.tableAliasLength` (and `tableNameLength`,
      `indexNameLength`) resolve `maxIdentifierLength` via the receiver, so an
      adapter override propagates; test with a stub overriding
      `maxIdentifierLength`.
- [ ] Non-MySQL adapters still resolve to 64.
