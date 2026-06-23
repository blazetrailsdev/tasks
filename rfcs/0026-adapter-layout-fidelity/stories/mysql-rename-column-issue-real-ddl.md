---
title: "mysql-rename-column-issue-real-ddl"
status: in-progress
updated: 2026-06-23
rfc: "0026-adapter-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: 4037
claim: "2026-06-23T22:00:42Z"
assignee: "mysql-rename-column-issue-real-ddl"
blocked-by: null
---

## Context

`AbstractMysqlAdapter#renameColumn` (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:903`)
is a no-op stub — it `void`s all three args and issues no DDL:

```ts
async renameColumn(tableName: string, columnName: string, newColumnName: string): Promise<void> {
  void tableName;
  void columnName;
  void newColumnName;
}
```

Rails' `ActiveRecord::ConnectionAdapters::AbstractMysqlAdapter#rename_column`
(`abstract_mysql_adapter.rb:440`) instead issues
`ALTER TABLE ... <rename_column_for_alter(...)>`. The real rebuild logic already
exists in trails as `renameColumnForAlter`
(`abstract-mysql-adapter.ts:1841`, which handles the MySQL ≥8.0.3 / MariaDB
≥10.5.2 `RENAME COLUMN` path plus the `CHANGE` fallback for older versions) —
but nothing reaches it via the public `renameColumn` entry point, so column
renames silently do nothing on MySQL/MariaDB.

Surfaced in review of PR #3985 (RFC 0031 schema-cache invalidation); that PR
correctly skipped this method because a no-op issues no DDL and so needs no
schema-cache clear. This is a separate DDL-fidelity gap.

## Acceptance criteria

- [ ] `AbstractMysqlAdapter#renameColumn` issues real DDL via
      `renameColumnForAlter` (through the bulk-alter path), matching
      `abstract_mysql_adapter.rb:440`.
- [ ] Once it issues DDL under RFC 0031's always-warm cache, it must also
      `clearDataSourceCacheBang(this.pool, tableName)` before mutating, like the
      sibling DDL methods (the reason PR #3985 left it alone).
- [ ] A test renames a column on a MySQL/MariaDB-backed table and asserts the
      new column name is present and the old one gone.
- [ ] Test names match Rails verbatim.
- [ ] PG/MySQL per gate.
