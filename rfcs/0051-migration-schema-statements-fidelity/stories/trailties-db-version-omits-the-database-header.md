---
title: "trailties db version omits the database: header and both blank lines"
status: draft
updated: 2026-08-26
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing `trailties-migrate-status-duplicates-database-tasks-migrate-status`
(PR #7093), which converged `db migrate:status` onto
`DatabaseTasks.migrateStatus()`. The same story's context flagged `db version` as
carrying the identical divergence; it was out of that story's acceptance criteria
and left untouched to keep the PR scoped.

Rails' `db:version`
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake:307-313`):

```ruby
task version: :load_config do
  ActiveRecord::Tasks::DatabaseTasks.with_temporary_pool_for_each(env: Rails.env) do |pool|
    puts "\ndatabase: #{pool.db_config.database}\n"
    puts "Current version: #{pool.migration_context.current_version}"
    puts
  end
end
```

Three `puts`: a leading blank line plus a `database:` header, the version line,
and a trailing blank line.

trails (`packages/trailties/src/commands/db.ts:770-780`) prints only the middle
one:

```ts
const version = (await migrationContextFor(adapter, []).currentVersion()) ?? "";
console.log(`${prefix}Current version: ${version}`);
```

So the `database:` header line and both blank lines are dropped. Unlike
`migrate:status` there is no `DatabaseTasks` method to delegate to — Rails keeps
this body inline in the rake task — so the convergence is to port the three
`puts` at the task, not to invent a `DatabaseTasks.version`.

Note the pool handle: Rails reads `pool.db_config.database` off the block
parameter `with_temporary_pool_for_each` yields. trailties' `forEachDatabase`
yields `{ adapter, raw, config, name, prefix }` and already holds the resolved
`HashConfig`, so the database name is in hand without a new accessor.

## Converged shape

```ts
await forEachDatabase(opts, async ({ adapter, config, prefix }) => {
  // three puts, mirroring databases.rake:309-312
});
```

with the leading blank line, the `database: <name>` header and the trailing
blank line restored, and the `${prefix}` multi-DB prefix kept wherever
`withPrefixedStdout` already provides it.

## Acceptance criteria

- [ ] `db version`'s output matches `databases.rake:309-312` line for line,
      including the `database:` header and both blank lines.
- [ ] The database name comes from the config the command already resolves, with
      no new accessor and no `DatabaseTasks.version` invention.
- [ ] `packages/trailties/src/commands/db.test.ts` keeps its test names.
