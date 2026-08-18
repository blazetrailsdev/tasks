---
title: "DatabaseTasks.forEach takes a built DatabaseConfigurations instead of constructing one"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into database-tasks-configuration-registry-split-from-base-configurations — both are the DatabaseTasks-vs-Base.configurations registry split (database_tasks.rb:141-154, :552); one read of tasks/database-tasks.ts"
---

# DatabaseTasks.forEach takes a built DatabaseConfigurations instead of constructing one

## Context

Surfaced converging the `tasks/*` call-set rows in #6664; the
`for_each | new` row is baselined with a per-site reason rather than converged.

Rails, `vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:141-154`:

```ruby
def for_each(databases) # :nodoc:
  return {} unless defined?(Rails)

  database_configs = ActiveRecord::DatabaseConfigurations.new(databases).configs_for(env_name: Rails.env)

  # if this is a single database application we don't want tasks for each primary database
  return if database_configs.count == 1

  database_configs.each do |db_config|
    next unless db_config.database_tasks?

    yield db_config.name
  end
end
```

`databases` is the raw railtie configuration hash; Rails wraps it in a fresh
`DatabaseConfigurations` on the spot. trails'
`DatabaseTasks.forEach(databases: DatabaseConfigurations, fn)`
(`packages/activerecord/src/tasks/database-tasks.ts`) requires the caller to
have built it, so the `new` never happens here. It also drops the
`db_config.database_tasks?` guard, yielding every config's name.

## Converged shape

Take the raw configuration hash and construct `DatabaseConfigurations` inside
the body, then filter on `databaseTasks` before yielding, matching `:150-153`.
`defined?(Rails)` has no trails analogue — leave that arm out and say so at the
call site, or fold it into the existing SKIP entry if one covers it.

## Acceptance criteria

- [ ] `forEach` constructs `DatabaseConfigurations` from its argument and honours
      the `database_tasks?` guard.
- [ ] Callers updated to pass the raw hash.
- [ ] Delete the `for_each | new` row from the exclude shard by hand via
      `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/tasks/database-tasks.json`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
