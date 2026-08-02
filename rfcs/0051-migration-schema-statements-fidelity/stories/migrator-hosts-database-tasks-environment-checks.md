---
title: "Migrator hosts DatabaseTasks' environment checks"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5861
claim: "2026-08-02T03:16:48Z"
assignee: "migrator-hosts-database-tasks-environment-checks"
blocked-by: null
closed-reason: null
---

## Context

`Migrator` carries `checkEnvironment`, `checkProtectedEnvironments` and
`protectedEnvironment` (`packages/activerecord/src/migration.ts`). None of the
three is on Rails' `Migrator`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1405-1620`): they are
`Tasks::DatabaseTasks` methods — `check_current_environment` /
`check_protected_environments!` / `check_current_protected_environment!` at
`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:65-71` and
`635-650`, which reach the state through `pool.migration_context`.

Because they live on `Migrator`, they are also the only remaining reason
`Migrator#lastStoredEnvironment` exists: PR #5845 deleted the rest of the
MigrationContext-shaped block but had to keep that one member as their shared
helper. `MigrationContext#lastStoredEnvironment` already carries the Rails-sited
copy (`migration.rb:1348-1357`), so moving these three onto `DatabaseTasks`
lets the `Migrator` copy go too.

Their current tests live in `packages/activerecord/src/migrator.trails.test.ts`
(`checkEnvironment raises ...`, `checkProtectedEnvironments ...`).

## Acceptance criteria

- [ ] `checkEnvironment` / `checkProtectedEnvironments` / `protectedEnvironment`
      are gone from `Migrator`; the behavior lives on `DatabaseTasks` in the
      shape of `database_tasks.rb:65-71` / `635-650`, reading a
      `MigrationContext`.
- [ ] `Migrator#lastStoredEnvironment` is deleted — `MigrationContext` owns it.
- [ ] The existing `migrator.trails.test.ts` cases move with the behavior and
      keep asserting the same errors.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main.
