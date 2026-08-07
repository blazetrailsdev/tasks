---
title: "loadSchemaIfPendingBang drops any_schema_needs_update? / load_schema!; port migration.rb:730-736"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6168
claim: "2026-08-07T12:08:30Z"
assignee: "load-schema-if-pending-drops-the-whole-repair-arm"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration.load_schema_if_pending!`
(`vendor/rails/activerecord/lib/active_record/migration.rb:730-736`) is:

```ruby
def load_schema_if_pending!
  if any_schema_needs_update?
    load_schema!
  end

  check_pending_migrations
end
```

trails' `Migration.loadSchemaIfPendingBang`
(`packages/activerecord/src/migration.ts`, ~1573-1584) ships only the
`checkPendingMigrations` line. The whole repair arm is dropped, documented in
prose at the call site.

Two separate reasons, only one of which is a real language shortcoming:

- `load_schema!` (`migration.rb:775-783`) is `FileUtils.cd(root)` plus
  `system("bin/rails db:test:prepare")` — a roundtrip to Rake through a
  subprocess. trails has no process surface to shell to (hard rule: no
  `process.*`), so this one genuinely has no port today.
- `any_schema_needs_update?` (`migration.rb:747-751`) is portable on its own —
  it is just `!db_configs_in_current_env.all? { |c| Tasks::DatabaseTasks.schema_up_to_date?(c, ActiveRecord.schema_format) }`,
  and `DatabaseTasks.schemaUpToDate` already exists in trails
  (`packages/activerecord/src/tasks/database-tasks.ts`). It was dropped only
  because its sole consumer is the `load_schema!` branch, so on its own it
  answers a question nothing can act on.

Surfaced while shipping #6162 (which made `check_pending_migrations` real —
before that, this whole method was dead anyway).

## Converged shape

Port both, together. `anySchemaNeedsUpdate` and `dbConfigsInCurrentEnv` are
straightforward (`dbConfigsInCurrentEnv` already landed in #6162). The open
question is what `loadSchemaBang` can be when there is no subprocess: the
likely answer is to call the schema load in-process — `DatabaseTasks.loadSchema`
already exists — rather than shelling to `bin/rails db:test:prepare`, which is
itself only Rails' way of reaching the same code through Rake. If that holds,
this converges fully and the prose deviation note at the call site is deleted.

## Acceptance criteria

- `loadSchemaIfPendingBang` has the `if (await this.anySchemaNeedsUpdate())`
  branch, in Rails' order, ahead of `checkPendingMigrations`.
- `anySchemaNeedsUpdate` is ported against `DatabaseTasks.schemaUpToDate` and
  `ActiveRecord.schemaFormat`, per `migration.rb:747-751`.
- `loadSchemaBang` either lands in-process or the story is re-scoped to it
  alone with the subprocess blocker named; do not close this by rewriting the
  justification.
- The prose deviation note in `loadSchemaIfPendingBang`'s JSDoc is deleted or
  reduced to whatever genuinely cannot converge.
