---
title: "Boot schema warm covers every connection pool (connectsTo, reading role, shards)"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8258 made `active_record.initialize_database`
(`packages/trailties/src/trailties/active-record.ts`) await
`pool.schemaReflection.loadAllBang(pool)` on the pool returned by
`Base.establishConnection()`, so a cold `Post.new(...)` peeks a warm cache.
Rails loads each model's schema lazily and synchronously on first touch
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587-597`),
on whatever pool the model resolves to. In trails only `Base`'s primary pool is
warmed:

- Each `PoolConfig` owns its own `SchemaReflection`
  (`packages/activerecord/src/connection-adapters/pool-config.ts:44-49`), so
  warming one pool leaves every other pool cold.
- `connectsTo` in `ApplicationRecord` / `AnimalsRecord` class bodies registers
  pools under that class's connection name. Those bodies run when the
  Finisher's `setup_main_autoloader` loads `app/models`
  (`packages/trailties/src/application/finisher.ts`), which is after
  `initialize_database`.
- As a result, `Dog.new(...)` on a secondary database, `Post.new(...)` under a
  standard `ApplicationRecord.connectsTo({ database: { writing: "primary", reading: "primary_replica" } })`,
  and a `new` inside `connectedTo({ role: "reading" })` or on a shard still
  raise `UnknownAttributeError` as the first access.

## Acceptance criteria

- [ ] After boot, every pool in `Base.connectionHandler.connectionPoolList("all")`
      (all roles and shards) has been warmed, with an awaited step that runs
      after `app/models` has been loaded, not only `Base`'s primary pool.
- [ ] A boot-app test with a `connectsTo` `ApplicationRecord` (writing + reading)
      and a second database answers a first-request `new`-based POST for a
      model on each.
- [ ] The test-env skip and the `ActiveRecordError` warn arm
      (`railtie.rb:159-160,175-180`) apply per pool.
