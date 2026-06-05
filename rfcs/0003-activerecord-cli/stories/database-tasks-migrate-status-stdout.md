---
title: "DatabaseTasks.migrateStatus stdout fidelity (P3-5)"
status: claimed
updated: 2026-06-04
rfc: "0003-activerecord-cli"
cluster: cli
deps: []
deps-rfc: []
est-loc: 20
priority: 16
pr: null
claim: "2026-06-05T16:11:39Z"
assignee: "database-tasks-migrate-status-stdout"
blocked-by: null
---

## Context

DatabaseTasks P3-5 from `activerecord-gaps.md`. Still live as of 2026-06-05. The
formatted up/down migration table shipped at the CLI layer
(`ar db:migrate:status`, #2743), but Rails prints it from
`DatabaseTasks.migrate_status` itself
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:302` — body
at `:308-314`: `puts "\ndatabase: …"`, the `'Status'.center(8) … 'Migration ID'.ljust(14)`
header, a `"-" * 50` rule, then `puts` per `migrations_status` row).
Trails' `DatabaseTasks.migrateStatus()`
(`packages/activerecord/src/tasks/database-tasks.ts:923`) still only returns the
structured array (`return migrator.migrationsStatus()`, `:929`); the Rails-shaped
formatting lives in the CLI instead — `printMigrateStatusTable`
(`packages/activerecord-cli/src/db-tasks.ts:372`, called from `dbMigrateStatus` at
`:385`). Lower priority now that the user-facing table exists.

## Acceptance criteria

- [ ] `DatabaseTasks.migrateStatus()` (`database-tasks.ts:923`) emits the
      Rails-shaped `puts` output (database header + per-row status) itself,
      matching `database_tasks.rb:308-314`.
- [ ] CLI `ar db:migrate:status` keeps working — `printMigrateStatusTable`
      (`db-tasks.ts:372`) delegates to / doesn't double-print.
- [ ] Test: "migrate status table".

## Notes

Migrated from `activerecord-gaps.md` (DatabaseTasks P3-5) during the RFC 0011
cutover. No standalone DatabaseTasks-parity RFC exists; homed here since RFC
0003 owns the `ar db:*` surface.
