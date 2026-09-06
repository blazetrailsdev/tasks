---
title: "pinned-connection-depth-lives-on-the-cache-config-not-the-pool"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7539
claim: "2026-09-05T22:06:49Z"
assignee: "converge-adapter-args-url-parsing-onto-connection-url-resolver"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while scoping `inline-ruby-bodies-extracted-as-named-helpers` in
PR #7306. That story asks for the `incrementPinnedCount` /
`decrementPinnedCount` receipts in
`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:298-310`
to be inlined at their Rails site. They cannot be, as written, because the state
they wrap lives on the wrong object — a second deviation the receipts hide.

Rails keeps BOTH pieces of pinning state as ivars on `ConnectionPool` itself:

- `@pinned_connection` and `@pinned_connections_depth`, initialized at
  `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:268`
- incremented inline in `pin_connection!` (`connection_pool.rb:327`) and
  decremented inline in `unpin_connection!` (`connection_pool.rb:345`), with
  `@pinned_connection = nil if @pinned_connections_depth.zero?` at `:347`
- read by `clear_query_cache`, which branches on `@pinned_connection` being
  non-nil — NOT on the depth counter
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:177-185`)

trails splits them across two objects. The counter is `_pinnedCount`, a private
field on `ConnectionPoolConfiguration` in `query-cache.ts:187`, while the pins
themselves are `_pinnedConnections` (a per-execution-context Map) plus
`_fixturePin` on the pool in
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`.
Because the counter is private to another class, `pinConnectionBang` /
`unpinConnectionBang` (`connection-pool.ts:490,516,545`) can only reach it
through the two accessor methods — which is exactly the extracted-helper shape
the parent story is trying to delete, so the receipts cannot be retired without
first moving the state.

Note also that trails' `clearQueryCache` (`query-cache.ts:283-288`) tests
`this._pinnedCount > 0` where Rails tests `@pinned_connection`. The counter is
standing in for "is anything pinned", which is why it had to be visible to the
cache object at all.

## Converged shape

Put the pinning state where Rails puts it — on the pool — so `pin_connection!`
and `unpin_connection!` increment and decrement it inline, as Rails does, and
the two accessor methods disappear with their `@noRailsEquivalent CONVERGEABLE
inline-ruby-bodies-extracted-as-named-helpers` receipts. `clearQueryCache` then
branches on a pinned connection existing, matching `query_cache.rb:178`, rather
than on a count.

Whether trails' per-context `_pinnedConnections` map plus `_fixturePin` can
collapse onto Rails' single `@pinned_connection` is the design call this story
makes; if it cannot, the depth counter still belongs beside them on the pool
rather than on the cache configuration.

## Acceptance criteria

- `incrementPinnedCount` / `decrementPinnedCount` are gone, along with their
  `@noRailsEquivalent` receipts, and `pin_connection!` / `unpin_connection!`
  adjust the depth inline as `connection_pool.rb:327,345` do.
- `clearQueryCache` branches on the pinned connection, not on a count, matching
  `query_cache.rb:177-185`.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
- Query-cache and transactional-fixture suites stay green on all three adapters.
