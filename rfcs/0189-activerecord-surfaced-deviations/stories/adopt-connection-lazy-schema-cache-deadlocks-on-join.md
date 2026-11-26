---
title: "adopt-connection-lazy-schema-cache-deadlocks-on-join"
status: done
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10763
claim: "2026-11-25T21:21:58Z"
assignee: "adopt-connection-lazy-schema-cache-deadlocks-on-join"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/application/rake/dbs.test.ts` ports
`vendor/rails/v8.0.5.2/railties/test/application/rake/dbs_test.rb`. Its test
"lazily loaded schema cache isn't read when reading the schema migrations
table" (`dbs_test.rb:829-848`) hangs on the second `bin/trails db:drop`
(Node reports an unsettled top-level await in `bin/trails`).

The chain: `db:check_protected_environments` checks out a connection.
`ConnectionPool#adoptConnection`
(`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`)
calls `schemaCache.loadBang()` when `lazilyLoadSchemaCache` is on, as Rails'
`adopt_connection` does (`connection_pool.rb:930-939`).
`SchemaReflection#loadCache`
(`packages/activerecord/lib/connection-adapters/schema-cache.ts`) then checks
the dump version inside a nested `pool.withConnection`. The `withConnection`
join arm (`pendingCheckouts`, story
`with-connection-pending-checkout-join-needs-ruling`) makes that nested call
join the pending checkout it is running inside, so it waits on itself. Rails'
`with_connection` (`connection_pool.rb:405-424`) has no join: the nested call
finds no lease connection and checks out a second one.

## Acceptance criteria

- The nested `withConnection` inside a checkout's `adoptConnection` no longer
  waits on that checkout.
- "lazily loaded schema cache isn't read when reading the schema migrations
  table" passes in `packages/trailties/test/application/rake/dbs.test.ts`.
- "withConnection overlapping on an empty lease checks out one connection"
  stays green, or the join-arm story's ruling replaces it.
