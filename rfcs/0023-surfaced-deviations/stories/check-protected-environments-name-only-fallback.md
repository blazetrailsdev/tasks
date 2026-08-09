---
title: "Remove the name-only ProtectedEnvironmentError fallback when no configs exist"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: database-tasks.ts:662-672 checkProtectedEnvironmentsBang now only loops configsFor(envName) calling checkCurrentProtectedEnvironmentBang; the name-only ProtectedEnvironmentError fallback is gone, so zero configs performs zero checks as in database_tasks.rb:625-650."
---

## Context

`DatabaseTasks.checkProtectedEnvironmentsBang`
(`packages/activerecord/src/tasks/database-tasks.ts:590-598`) has a
trails-invented fallback: when `DatabaseTasks.databaseConfiguration` is unset
and the requested env name is in `Base.protectedEnvironments`, it raises
`ProtectedEnvironmentError(envName)` without consulting any database.

Rails' `check_protected_environments!`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:625-650`)
only ever raises from `check_current_protected_environment!`, which reads the
stored stamp out of `ar_internal_metadata` per `db_config`. With zero configs
it performs zero checks and raises nothing — the env _name_ alone never trips
the guard.

Surfaced while converging the migrator construction in PR #5771; that PR left
the fallback untouched because the story scoped it out (there is no migrator
on that path).

## Acceptance criteria

- [ ] Either the name-only fallback is removed so zero configs performs zero
      checks as in Rails, or the reason it must stay is stated at the call
      site with the Rails divergence spelled out.
- [ ] Existing coverage that depends on the fallback (see
      `DatabaseTasksCheckProtectedEnvironmentsTest > raises an error when
called with protected environment` in
      `packages/activerecord/src/tasks/database-tasks.test.ts:19`) is
      reconciled against the Rails test it mirrors.
