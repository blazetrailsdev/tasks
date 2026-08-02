---
title: "checkProtectedEnvironmentsBang reads the config env, not DEFAULT_ENV"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5853
claim: "2026-08-02T01:56:48Z"
assignee: "check-protected-environments-current-env-is-config-env"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.checkProtectedEnvironmentsBang`
(`packages/activerecord/src/tasks/database-tasks.ts`) computes the "current"
environment as `config.envName` — the db_config's own env — where Rails reads
`migration_context.current_environment`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:638`),
which is `MigrationContext#current_environment` =
`ConnectionHandling::DEFAULT_ENV.call` (`migration.rb:1340-1342`), i.e. the
global default env, not per-config.

PR #5845 routed this call site through a `MigrationContext` but had to keep
`config.envName` for `current`, because the divergence is pinned by
`packages/activerecord/src/tasks/database-tasks-protected-environments-env.trails.test.ts`
("compares the stored environment against the config's own environment", which
asserts `DatabaseTasks.env` is _not_ the config's env and that the check still
passes). Converging means deciding whether that trails test encodes a real
requirement — `checkProtectedEnvironmentsBang(environment)` takes the env
explicitly, where Rails' `check_protected_environments!(environment = env)` then
still compares against the global default — or whether it ratified a bug.

## Acceptance criteria

- [ ] Decide, with `database_tasks.rb:65-71` / `635-650` and `migration.rb:1340-1342`
      as the anchor, whether `current` should be the global default env.
- [ ] If it should: `current` reads `context.currentEnvironment`, and the
      trails test is rewritten to match Rails rather than the old behavior.
- [ ] If the per-config env is genuinely required, the divergence is justified
      at the call site with the reason, and the trails test states it.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main.
