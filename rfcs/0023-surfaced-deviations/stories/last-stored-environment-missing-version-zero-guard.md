---
title: "Migrator#lastStoredEnvironment misses Rails' current_version==0 nil short-circuit"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `MigrationContext#last_stored_environment` (migration.rb) short-circuits
`return nil if current_version == 0` BEFORE the `internal_metadata.table_exists?`
check — an unmigrated database (version 0) is treated as unstamped even when
`ar_internal_metadata` exists and carries an `environment` row.

Trails `Migrator#lastStoredEnvironment`
(packages/activerecord/src/migration.ts:2988-3008) only consults
`currentVersionReadOnly() === 0` in the table-ABSENT branch; when the metadata
table exists it returns the stored environment unconditionally. So a database
stamped with a protected environment but with zero applied migrations trips
`ProtectedEnvironmentError` in trails where Rails would pass — surfaced while
porting `test_with_multiple_databases` (database_tasks_test.rb:155, PR #5088),
which creates `schema_migrations` version 1 specifically to satisfy Rails'
version gate; the trails port passes with or without that step.

## Acceptance criteria

- [ ] `lastStoredEnvironment` returns null at version 0 regardless of metadata-table presence, mirroring Rails' guard order.
- [ ] tasks/database-tasks tests (protected-environments suite) still pass.
