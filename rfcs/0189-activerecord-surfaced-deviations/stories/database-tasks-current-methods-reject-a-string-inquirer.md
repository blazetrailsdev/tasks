---
title: "activerecord: DatabaseTasks' *_current methods reject a StringInquirer environment"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

Rails' `DatabaseTasks.create_current(environment = env, name = nil)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:170-174`),
`drop_current`, `truncate_all` and `each_current_environment` (`:592-596`) take
whatever `Rails.env` is, and Rails' tests pass
`ActiveSupport::StringInquirer.new("test")`
(`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb:506,520,536,555`).

trails types the parameter `string | EnvironmentInquirer` at 25 sites across
`packages/activerecord/src/tasks/database-tasks.ts` and
`packages/activerecord/src/database-configurations.ts`. A `StringInquirer` is
not assignable: it lacks the `"development?"` / `"test?"` / `"production?"`
members `EnvironmentInquirer` declares
(`packages/activesupport/src/environment-inquirer.ts:10-14`). So the ported
tests pass `new EnvironmentInquirer("test")` where Rails passes a
`StringInquirer` (trails#8867).

Widening every site to `string | StringInquirer` was tried on trails#8867 and
fails typecheck in `packages/activerecord-cli/src/db-helpers.ts:25`
(`'string | StringInquirer' is not assignable to parameter of type 'string'`),
where `DatabaseTasks.env` is handed to `establishEnvironmentConnection`.

## Acceptance criteria

- [ ] `createCurrent`, `dropCurrent`, `truncateAll` and the helpers they
      forward to accept a `StringInquirer`, as the Rails methods do.
- [ ] `activerecord-cli`'s `establishEnvironmentConnection` call typechecks
      without a cast.
- [ ] `database-tasks.test.ts` passes `new StringInquirer("test")` wherever
      `database_tasks_test.rb` passes `ActiveSupport::StringInquirer.new("test")`.
