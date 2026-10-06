---
title: "activerecord: DatabaseTasks drops the invented _normalizeEnv / _errorToS helpers and load_schema's ensure covers its early return"
status: draft
updated: 2026-10-06
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DatabaseTasks` takes its environment from a default parameter and nothing else:
`create_current(environment = env, name = nil)`, `drop_current(environment = env)`,
`purge_current(environment = env)`, `load_schema_current(format = …, file = nil, environment = env)`,
`db_configs_with_versions(environment = env)`,
`with_temporary_pool_for_each(env: ActiveRecord::Tasks::DatabaseTasks.env, …)`, and `migrate_all` /
`prepare_all` read `env` directly
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:170,176-186,226,244,285,356,474,512`).

trails routes all of them through an invented private helper,
`DatabaseTasks._normalizeEnv(environment?)` (`packages/activerecord/src/tasks/database-tasks.ts`), which
trims the argument and falls back to `this.env` when it is blank. Rails has no such method, does not trim,
and does not treat a blank string as absent.

Two more shapes in the same file surfaced while converging the arms in trails#8548:

- `_errorToS(error)`, a module helper standing in for `$stderr.puts error` in `create` / `drop`
  (`database_tasks.rb:122,217`).
- `loadSchema` returns on `file == null` BEFORE its `try`, where Rails' method-level `ensure`
  (`database_tasks.rb:376-395`) also covers `return unless file`. The arms report files it as an `order`
  row: `try if if if throw -> if try if if throw`.

## Acceptance criteria

- [ ] `_normalizeEnv` is deleted; each method takes Rails' default (`environment = DatabaseTasks.env`),
      and no caller relies on a blank string meaning "the current env".
- [ ] `_errorToS` is deleted; `create` / `drop` write the error the way `$stderr.puts error` does.
- [ ] `loadSchema`'s early return sits inside the `try`, and the `order` row is gone from
      `pnpm parity:api:arms:report --package=activerecord`.
