---
title: "ConnectionPoolConfiguration is a separate object where Rails includes it into the pool"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails mixes its query-cache pool state into `ConnectionPool` itself —
`QueryCache::ConnectionPoolConfiguration` is a module `include`d there, so
`clear_query_cache` reads `@pinned_connection` as a plain ivar of the pool
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:177-185`),
alongside `@pinned_connections_depth` initialized at
`abstract/connection_pool.rb:268`.

trails makes it a **separate class**,
`ConnectionPoolConfiguration` in
`packages/activerecord/src/connection-adapters/abstract/query-cache.ts`,
instantiated as the pool's `_cacheConfig` field
(`abstract/connection-pool.ts`). Because it is a different object, it cannot
see the pool's pinning state at all.

PR #7539 closed `pinned-connection-depth-lives-on-the-cache-config-not-the-pool`
by deleting the `incrementPinnedCount` / `decrementPinnedCount` accessors (and
their `@noRailsEquivalent CONVERGEABLE` receipts) and making `clearQueryCache`
branch on the pinned connection as `query_cache.rb:178` does — but it bridged
the object split with a **constructor callback**:

```ts
constructor(queryCache?: unknown, pinnedConnection: () => unknown = () => null)
```

which the pool supplies as `() => this._resolvePinnedConnection()`. That
callback is the residue of the split: Ruby needs no such parameter because the
module is already `self`. It adds no public name, so no gate flags it, but it
is a shape Rails does not have.

The settled trails idiom for a Ruby `include` is `include()` / `Included<>`
from `@blazetrails/activesupport`, or `this`-typed functions assigned to the
class (CLAUDE.md, "Module mixins"). Neither was used here.

## Converged shape

`ConnectionPoolConfiguration` becomes a mixin over `ConnectionPool` by the
repo's settled idiom, so its members read the pool's own fields and the
`pinnedConnection` constructor callback disappears. `clearQueryCache` then
reads the pinned connection directly, as `query_cache.rb:177-185` does.

Decide at the same time whether trails' per-execution-context
`_pinnedConnections` map plus `_fixturePin` can collapse onto Rails' single
`@pinned_connection` (`connection_pool.rb:268`) — the design call the prior
story deferred.

## Acceptance criteria

- [ ] `ConnectionPoolConfiguration`'s constructor takes no pinning callback.
- [ ] Its members reach the pool's state the way an `include`d module reaches
      `self`, via the repo's mixin idiom.
- [ ] Query-cache and transactional-fixture suites green on all three adapters.
- [ ] `pnpm parity:api:extra:gate` does not grow.
