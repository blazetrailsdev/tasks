---
title: "activerecord: ConnectionPool#adopt_connection awaits its lazy schema_cache.load!"
status: closed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: trails#8707 made adoptConnection await the load before merging; the only un-awaited adoption left is inside acquireConnectionSync, which sync-reads-of-async-reflection-retire-with-rfc-0073 already retires."
---

## Context

Rails' `ConnectionPool#adopt_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:926-935`)
ends with `schema_cache.load!` under `if @schema_cache.nil? && ActiveRecord.lazily_load_schema_cache`,
and the load has finished by the time the checkout returns.

trails' `adoptConnection` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
makes the same call but does not await it: `void this.schemaCache.loadBang()`. `loadBang` is async
(it reads the dump file and checks the schema version over a connection), and `adoptConnection` is
reached from synchronous callers: `remove` through `bulkMakeNewConnections`, and
`acquireConnectionSync` through `tryToCheckoutNewConnection`. So a checkout returns before the
lazily loaded cache is in place, and a failure in the load surfaces as an unhandled rejection
instead of at the checkout. `connection-pool.trails.test.ts` polls with `vi.waitFor` for that
reason. Landed in trails#8707.

## Acceptance criteria

- [ ] `adoptConnection` awaits `this.schemaCache.loadBang()`, and `tryToCheckoutNewConnection` and
      `bulkMakeNewConnections` await it in turn.
- [ ] `remove` and the sync checkout path no longer reach an un-awaited adoption
      (`acquireConnectionSync` retires with `sync-reads-of-async-reflection-retire-with-rfc-0073`).
- [ ] The lazy-load tests in `connection-pool.trails.test.ts` assert straight after the checkout,
      with no `vi.waitFor`.
