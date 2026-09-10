---
title: "pinned connection is a per-context map plus a fixture slot, where Rails has one @pinned_connection"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 70
pr: 7657
claim: "2026-09-09T23:42:02Z"
assignee: "remove-invented-translate-and-enrich-wrapper"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `ConnectionPoolConfiguration` onto Rails' mixin shape
(#7607, story `query-cache-pool-configuration-is-a-class-not-a-mixin`). That
story explicitly deferred the design call: whether trails' per-execution-context
pinning can collapse onto Rails' single `@pinned_connection`.

Rails keeps ONE pinned connection per pool, plus a depth counter:

- `@pinned_connection = nil` / `@pinned_connections_depth = 0`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:267-268`)
- `pin_connection!` / `unpin_connection!`
  (`connection_pool.rb:271-306`) push and pop that single slot.
- `clear_query_cache` reads it as a plain ivar (`abstract/query_cache.rb:178`).

trails instead carries TWO structures on `ConnectionPool`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`):

- `_pinnedConnections: Map<number, { connection, depth }>` — keyed by
  execution-context id.
- `_fixturePin: { connection, depth } | null` — a second, context-free slot the
  fixture path uses.

and a private `_resolvePinnedConnection()` that consults the fixture slot first,
then the current context's entry. #7607 wired the mixin's `clearQueryCache` to
that resolver, which is the closest thing to `query_cache.rb:178` the split
allows — but the two-structure shape itself is the deviation and is untouched.

The reason it was NOT collapsed in #7607: several execution contexts share one
pool inside a single Node process, where Ruby has a thread-local pool per thread
plus one pinned connection, so a single slot would let one context's fixture pin
leak into another context's checkout. That is a real constraint, not a
preference — but it has never been written down as a ratified language
shortcoming, and it may not survive contact with the actual Rails threading
model, where `pin_connection!` is likewise called from a single thread's
`setup`/`teardown`.

## Converged shape

Establish whether `_pinnedConnections` + `_fixturePin` can become one
`_pinnedConnection` slot plus `_pinnedConnectionsDepth`, matching
`connection_pool.rb:267-268,271-306`. If they can, collapse them and let
`clearQueryCache` read the slot directly, as `query_cache.rb:178` does. If they
genuinely cannot — because trails' execution contexts are not the Rails thread
they stand in for — write the constraint down as a ratified repo-wide decision
(the way CLAUDE.md ratifies the dual sync/async hash and the zero-import slot),
so no future port re-derives it, and keep `_resolvePinnedConnection` as its one
sanctioned shape.

Read `fixture-pin-takes-an-unleased-connection` and
`converge-unpin-connection-teardown-statement-order` first — both are in this
RFC and touch the same two fields.

## Acceptance criteria

- [ ] Either the two pinning structures are one slot matching
      `connection_pool.rb:267-268`, or the divergence is ratified in CLAUDE.md
      with the specific execution-context constraint that forces it.
- [ ] `clearQueryCache`'s read matches `query_cache.rb:177-185` under whichever
      outcome lands.
- [ ] Transactional-fixture and query-cache suites green on all three adapters.
