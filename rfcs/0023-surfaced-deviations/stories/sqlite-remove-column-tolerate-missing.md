---
title: "sqlite-remove-column-tolerate-missing"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`migration_test.rb#test_remove_column_with_if_not_exists_not_set` asserts that
on SQLite, removing a column that does not exist raises nothing
(`assert_nothing_raised`), while PostgreSQL/MySQL raise. Rails' `SQLite3Adapter`
implements `remove_column` via a table rebuild (create a new table copying every
column except the dropped one, then swap), so a missing column is simply absent
from the copy set — a no-op.

trails' `SchemaStatements#removeColumn`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:396`)
and `MigrationContext#removeColumn`
(`packages/activerecord/src/migration.ts:2321`) both emit a native
`ALTER TABLE ... DROP COLUMN`. SQLite 3.35+ supports that DDL but rejects a
missing column with `no such column: "<name>"`, so trails raises where Rails
tolerates. This is the same class of base-vs-adapter write-method divergence as
`sqlite-change-column-table-rebuild` (PR #3944): the SQLite adapter has a
table-rebuild `removeColumn` override
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1558`) that
the SchemaStatements migration path bypasses.

The converged test
`packages/activerecord/src/migration.test.ts` ("remove column with if not
exists not set") currently documents this as tracked-pending-convergence and
asserts the trails `no such column` raise on SQLite.

## Acceptance criteria

- [ ] Route the SchemaStatements / MigrationContext `removeColumn` path through
      the SQLite table-rebuild override (or otherwise tolerate a missing column
      on SQLite) so removing a non-existent column is a no-op, matching Rails'
      SQLite3Adapter.
- [ ] Update the `remove column with if not exists not set` SQLite branch in
      `migration.test.ts` to `assert_nothing_raised` semantics (no raise) and
      drop the tracked-deviation comment.
- [ ] PG/MySQL behavior (raise on missing column) unchanged.
