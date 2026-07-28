---
title: "DatabaseTasks.databaseConfiguration is a separate registry from Base.configurations"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.databaseConfiguration`
(`packages/activerecord/src/tasks/database-tasks.ts:55`) is a registry
independent of `Base.configurations`. Rails has no such field — every
`DatabaseTasks` lookup goes through `Base.configurations`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:552`,
`def configs_for(**options) = Base.configurations.configs_for(**options)`).

The split forces call sites to diverge. `createCurrent`
(`database-tasks.ts:217-222`) must do `findDbConfig(envName)` and establish with
the resolved config object, because Rails' literal shape —
`migration_class.establish_connection(environment.to_sym)`
(`database_tasks.rb:653`) — would resolve the env string against
`Base.configurations` and can pick a different config.

`support/connection.ts:390-392` sets both registries together, but callers
reassign `databaseConfiguration` alone (e.g.
`packages/trailties/src/commands/db.test.ts:1162`, which swaps in a
production-env registry and restores only that field plus
`DatabaseConfigurations.current`), so the two genuinely diverge in practice.

Surfaced in review of PR #5507, which documented the divergence at the
`createCurrent` call site rather than converging it.

## Acceptance criteria

- [ ] Determine whether `DatabaseTasks.databaseConfiguration` can be retired in
      favour of `Base.configurations`, mirroring `database_tasks.rb:552`; if a
      distinct registry must stay, record why at its declaration.
- [ ] If retired, `createCurrent` establishes with the env string
      (`database_tasks.rb:653`) instead of a pre-resolved config object, and the
      call-site comment added by #5507 goes away.
- [ ] Callers that reassign `databaseConfiguration` alone (trailties `db.test.ts`
      and the AR task tests) are updated to the surviving registry.
- [ ] No test relies on the two registries holding different configs.
