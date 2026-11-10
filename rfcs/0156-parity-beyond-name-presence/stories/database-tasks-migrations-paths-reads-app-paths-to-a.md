---
title: "database-tasks-migrations-paths-reads-app-paths-to-a"
status: draft
updated: 2026-11-10
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Enrolling `activerecord` in `PROTOCOL_CALL_ENROLLED_PACKAGES` surfaced
`tasks/database-tasks.ts` `migrations_paths` omitting `to_a`. Rails is
`@migrations_paths ||= Rails.application.paths["db/migrate"].to_a`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:87-89`),
and `Rails::Paths::Path#to_a` is `alias to_a expanded`
(`vendor/rails/v8.0.2/railties/lib/rails/paths.rb:235`), which globs the
filesystem. trailties ports it as `toA(): Promise<string[]>`
(`packages/trailties/lib/paths.ts:204`), so the sync static getter
`DatabaseTasks.migrationsPaths` (`packages/activerecord/src/tasks/database-tasks.ts:78-84`)
cannot call it, and instead defaults to the literal `["db/migrate"]`.
`activerecord-cli/lib/db-helpers.ts:23` reads that default with no Trails app.
The row is baselined in `call-mismatches-exclude/activerecord/tasks/database-tasks.json`
pointing here.

## Acceptance criteria

- `migrationsPaths` reads `TopLevel.Trails!.application!.paths().get("db/migrate")`'s
  `to_a` lazily (`||=`), as Rails does — either by prewarming the expanded list at
  boot or by making the reader an awaited step where every caller already awaits.
- The `["db/migrate"]` literal default is removed and activerecord-cli seats its
  paths explicitly.
- The baseline row is deleted and `pnpm parity:api:calls` is green.
