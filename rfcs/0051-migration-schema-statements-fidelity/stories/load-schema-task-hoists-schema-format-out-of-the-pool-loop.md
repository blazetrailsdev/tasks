---
title: "loadSchemaBang reads SCHEMA_FORMAT outside the per-pool block Rails reads it inside"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6187
claim: "2026-08-07T18:00:51Z"
assignee: "restore-worker-connection-covers-only-arunit"
blocked-by: null
closed-reason: null
---

## Context

`db:test:load_schema` reads the schema format INSIDE the per-pool block
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake:531-539`):

```ruby
task load_schema: %w(db:test:purge) do
  ActiveRecord::Tasks::DatabaseTasks.with_temporary_pool_for_each(env: "test") do |pool|
    db_config = pool.db_config
    ActiveRecord::Schema.verbose = false
    schema_format = ENV.fetch("SCHEMA_FORMAT", ActiveRecord.schema_format).to_sym
    ActiveRecord::Tasks::DatabaseTasks.load_schema(db_config, schema_format)
  end
end
```

trails' `Migration.loadSchemaBang` (`packages/activerecord/src/migration.ts`,
the `loadSchemaBang` private static) hoists it out:

```ts
const schemaFormat = (getEnv("SCHEMA_FORMAT") ?? databaseTasks.schemaFormat) as SchemaFormat;
await databaseTasks.withTemporaryPoolForEach({ env: "test" }, async (pool) => {
  Schema.verbose = false;
  await databaseTasks.loadSchema(pool.dbConfig, schemaFormat);
});
```

Pre-existing — PR #6180 added the `Schema.verbose = false` line at the right
place (`:534`) but left the hoist alone as out of scope.

Observable where it matters: `schemaFormat` reads `databaseTasks.schemaFormat`,
which a `load_schema` call inside the loop can change, and `ENV["SCHEMA_FORMAT"]`
is re-read per iteration in Ruby. With one test config the two spellings agree;
with several they can diverge after the first iteration.

Also note the trails body reads `databaseTasks.schemaFormat` where Rails reads
the global `ActiveRecord.schema_format` — worth confirming those are the same
state, or converging them, in the same pass.

## Converged shape

Move the `schemaFormat` read inside the `withTemporaryPoolForEach` callback,
below the `Schema.verbose = false` line, matching `databases.rake:534-537` line
for line. Confirm the `ENV.fetch` fallback source matches Rails'
`ActiveRecord.schema_format`.

## Acceptance criteria

- [ ] `schemaFormat` is read inside the per-pool callback, after
      `Schema.verbose = false`, matching `databases.rake:534-537`.
- [ ] The fallback reads the same state Rails' `ActiveRecord.schema_format`
      does, or the divergence is converged alongside.
- [ ] `db:test:prepare` / `loadSchemaBang` coverage stays green on all lanes.
