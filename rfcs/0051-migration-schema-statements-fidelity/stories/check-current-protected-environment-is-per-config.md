---
title: "checkCurrentProtectedEnvironmentBang delegates outward instead of checking one config"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5859
claim: "2026-08-02T02:56:48Z"
assignee: "check-current-protected-environment-is-per-config"
blocked-by: null
closed-reason: null
---

## Context

`checkCurrentProtectedEnvironmentBang(dbConfig)`
(`packages/activerecord/src/tasks/database-tasks.ts:1602-1609`) is implemented
by opening a temporary connection and then delegating to
`DatabaseTasks.checkProtectedEnvironmentsBang(dbConfig.envName)`, which
re-resolves `configsFor({ envName })` and re-opens a temporary connection per
config.

Rails' `check_current_protected_environment!(db_config)`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:635-650`)
is the _inner_ method: it checks exactly the one db_config it is handed via
`with_temporary_pool`, and `check_protected_environments!`
(`database_tasks.rb:65-71`) is the outer loop that calls it per config. trails
has the dependency inverted, so a single-config check fans back out to every
config sharing that env name.

## Acceptance criteria

- [ ] `checkCurrentProtectedEnvironmentBang(dbConfig)` performs the
      stored/current/protected comparison for that one config only, mirroring
      `database_tasks.rb:635-650`.
- [ ] `checkProtectedEnvironmentsBang` becomes the outer loop calling it per
      config, mirroring `database_tasks.rb:65-71`.
- [ ] Existing protected-environment tests still pass.
