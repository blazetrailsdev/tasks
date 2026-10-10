---
title: "MigrationContext#migrationsStatus answers objects where Rails answers [status, version, name] triples"
status: in-progress
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8734
claim: "2026-10-09T23:09:51Z"
assignee: "schema-dumper-header-branches-on-the-ts-js-dump-language"
blocked-by: null
closed-reason: null
---

## Context

Seen while converging `MigrationContext#migrationsStatus` on trails#8712. Rails' `migrations_status`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1319-1337`) answers an Array of
three-element Arrays, `[status, version, name]`: `file_list` is built with `filter_map` returning
`[status, version, (name + scope).humanize]`, `db_list.map!` yields `["up", version, "********** NO FILE **********"]`,
and the result is `(db_list + file_list).sort_by { |_, version, _| version.to_i }`.

The port (`packages/activerecord/src/migration.ts`, `MigrationContext#migrationsStatus`) answers
`Array<{ status, version, name }>` objects, builds `db_list` as a `Set` and a separate `noFileList` instead of
`map!` on the list, and uses `map` where Rails uses `filter_map`. Its consumers read the object keys:
`DatabaseTasks.migrateStatus` (`packages/activerecord/src/tasks/database-tasks.ts`, `row.status` / `row.version` /
`row.name`; Rails destructures `|status, version, name|` at `tasks/database_tasks.rb`) and the tests in
`migrator.test.ts`, `multi-db-migrator.test.ts`, `migration-context.trails.test.ts`.

## Acceptance criteria

- [ ] `migrationsStatus` answers `[status, version, name]` triples, with `dbList` an array mutated as Rails
      mutates it (`delete`, `map!`), `filterMap` for the file list and a `sortBy` on `toI(version)`.
- [ ] `DatabaseTasks.migrateStatus` and the tests destructure the triple; no object-shaped row is left.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
