---
title: "DatabaseTasks.migrateStatus stdout fidelity (P3-5)"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: []
deps-rfc: []
est-loc: 20
priority: 16
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

DatabaseTasks P3-5 from `activerecord-gaps.md`. The formatted up/down migration
table shipped at the CLI layer (`ar db:migrate:status`, #2743), but Rails prints
it from `DatabaseTasks.migrate_status` itself (`database_tasks.rb:302` —
`puts "database: …"`, a header, then `puts` per `migrations_status` row).
Trails' `DatabaseTasks.migrateStatus()` (`tasks/database-tasks.ts:911`) still
only returns the structured array; the formatting lives in the CLI. Lower
priority now that the user-facing table exists.

## Acceptance criteria

- [ ] `DatabaseTasks.migrateStatus()` emits the Rails-shaped `puts` output
      (database header + per-row status) itself, matching `database_tasks.rb`.
- [ ] CLI `ar db:migrate:status` keeps working (delegates to / doesn't
      double-print).
- [ ] Test: "migrate status table".

## Notes

Migrated from `activerecord-gaps.md` (DatabaseTasks P3-5) during the RFC 0011
cutover. No standalone DatabaseTasks-parity RFC exists; homed here since RFC
0003 owns the `ar db:*` surface.
