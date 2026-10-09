---
title: "activerecord: ConnectionPool#new_connection takes Rails' body and drops its schema-cache warms"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8707
claim: "2026-10-09T13:24:04Z"
assignee: "type-virtualization-leaves-the-activerecord-rails-matched-tree"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`.

Rails' `ConnectionPool#new_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:701-706`)
is `connection = db_config.new_connection; connection.pool = self; connection`, with a
`rescue ConnectionNotEstablished => ex; raise ex.set_pool(self)`.

trails' `newConnection` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:608`)
adds an `instanceof AbstractAdapter` guard around the `pool=` write and two fire-and-forget schema-cache
warms (`_lazyLoadTriggered` / `_lazyLoadPromise` under `lazilyLoadSchemaCache()`, and `_eagerWarmTriggered`
/ `_eagerWarmPromise` under `SchemaReflection.eagerLoadSchemaCache`), each with its own `.then` / `.catch`.
`pnpm parity:api:arms:report --package=activerecord --direction=invented` reports
`+if +if +if +try +if +if +if +try +if` for the pair.

Rails loads the dumped cache from `SchemaReflection#cache` / `#load_cache`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:106-122`), on first
read of the cache, not at connection creation. CLAUDE.md § "Schema reflection peeks at a warm cache" names
the explicit async warm steps (`loadAllBang`, `eagerLoadSchemaCache`, trailties' `initialize_database`);
`newConnection` is not one of them.

## Acceptance criteria

- [ ] `newConnection` has Rails' body: the `db_config.new_connection` call, an unconditional `pool=` write,
      and the `ConnectionNotEstablished` rescue arm.
- [ ] The lazy and eager schema-cache warms move to the async warm step that owns them, or are deleted if
      an existing step already covers them. `_lazyLoadTriggered`, `_lazyLoadPromise`, `_eagerWarmTriggered`
      and `_eagerWarmPromise` are gone from the pool.
- [ ] The invented-direction arms report has no `connection-pool.ts#newConnection` row.
- [ ] The schema-cache and connection-pool suites pass on every adapter lane.
