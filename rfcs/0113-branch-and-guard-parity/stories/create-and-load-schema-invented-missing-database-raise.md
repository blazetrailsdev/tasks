---
title: "create_and_load_schema raises on a missing database name where Rails has no guard"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7268, which removed the `:memory:` suffix skip from the same
loop but left this guard as out of scope.

`TestDatabases.create_and_load_schema`
(`vendor/rails/activerecord/lib/active_record/test_databases.rb:14-17`) reads
the database name and assigns the suffixed one with no check at all:

```ruby
ActiveRecord::Base.configurations.configs_for(env_name: env_name).each do |db_config|
  db_config._database = "#{db_config.database}-#{i}"
  ActiveRecord::Tasks::DatabaseTasks.reconstruct_from_schema(db_config, ActiveRecord.schema_format, nil)
end
```

A `nil` `database` interpolates to `""`, so Rails writes `"-2"` and lets
`reconstruct_from_schema` fail on it downstream.

trails (`packages/activerecord/src/test-databases.ts`) opens the loop body with
an invented early raise instead:

```ts
const baseName = dbConfig.database;
if (!baseName) {
  throw new Error(
    `Cannot suffix database name for ${envName}/${dbConfig.name ?? "(unnamed)"}: ` +
      `neither database nor a parseable URL is available`,
  );
}
```

Three deviations in one arm: a guard Rails does not have, a bare `Error` rather
than a Rails error class at a Rails raise site, and a message string with no
Rails counterpart. The `baseName` local also has no Rails counterpart — Rails
reads `db_config.database` inline inside the interpolation.

## Converged shape

Delete the guard and the `baseName` local, so the body is the two Rails
statements:

```ts
dbConfig._database = `${dbConfig.database}-${i}`;
await DatabaseTasks.reconstructFromSchema(dbConfig, DatabaseTasks.schemaFormat, undefined);
```

Establish first what a `null`/`undefined` `database` produces through trails'
`reconstructFromSchema` — Rails' equivalent surfaces the failure there rather
than at the assignment, and the port should surface it in the same place. If
that path swallows it silently, the fix belongs in the task layer, not in a
guard inside `create_and_load_schema`.

## Acceptance criteria

1. `createAndLoadSchema` has no early raise Rails lacks, and reads
   `dbConfig.database` inline as `test_databases.rb:15` does.
2. The `throws a clear error when neither database nor URL yields a name` case
   in `test-databases.test.ts` is retired with the guard, or replaced by
   whatever the task layer actually surfaces.
3. `pnpm vitest run packages/activerecord/src/test-databases.test.ts` and the
   tasks/database-tasks suites pass.
