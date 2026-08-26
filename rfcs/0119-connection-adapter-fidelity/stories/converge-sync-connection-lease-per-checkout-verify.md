---
title: "converge-sync-connection-lease-per-checkout-verify"
status: blocked
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-26T17:54:27Z"
assignee: "sqlite-indexes-sorts-index-info-rows-rails-does-not"
blocked-by: "Cannot converge without flipping the sync surfaces async. trails' verifyBang (abstract-adapter.ts:1379) is async because ActiveModel-side active() is a real backend round-trip, where Rails' verify! (abstract_adapter.rb:759) is sync; the three residual sites are structurally synchronous — Ruby's deprecated .connection getter (connection-handling.ts:430-450), Arel::Nodes::Node#to_sql (arel/src/nodes/node.ts:46-64, sync at 600+ call sites) and leaseConnectionSync itself (connection-pool.ts:701) — so neither arm of the acceptance criteria is reachable: the self-heal cannot run synchronously, and the sites cannot await. The named owner retire-connection-pool-async-resolution-shims already landed as #6095 without covering this; needs a new epic that makes to_sql/.connection async before this residual can close."
closed-reason: null
---

## Context

`connection-pool-pinned-sync-checkout-per-checkout-verify` landed as #4443, but
the residual it describes is still in the tree at three sites, each citing the
landed story as its tracker:

- `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:636-660`
  — `leaseConnectionSync()`, the sync lease that skips the async per-checkout
  `verifyBang`. It is `@internal` and already carries
  `@noRailsEquivalent CONVERGEABLE`.
- `packages/activerecord/src/connection-handling.ts:499-509` — the deprecated
  sync `.connection` getter routes through `leaseConnectionSync`, losing the
  self-heal Rails' `lease_connection` performs there.
- `packages/arel/src/nodes/node.ts:49-60` — `toSql` takes the sync
  `engine.connection` lease in place of Rails'
  `engine.with_connection { |c| ... }` (`arel/nodes/node.rb:148-153`), skipping
  the same verify.

The root cause is unchanged: trails' Rails-named `leaseConnection` / `checkout`
became async (they await per-checkout `verifyBang`), while all three call sites
are synchronous — `to_sql` alone is sync at 600+ call sites. The
`@noRailsEquivalent` tag at connection-pool.ts:655 names
`retire-connection-pool-async-resolution-shims` as the convergence owner, so
this residual should either fold into that story or be tracked here.

See also `project_sync_active_getter_drops_rails_live_probe` and
`project_pool_adapter_proxy_makes_sync_methods_async`.

## Acceptance criteria

- The per-checkout `verifyBang` self-heal is restored on the sync paths, or
  `leaseConnectionSync` is retired in favour of the async Rails-named surface
  at all three sites.
- All three comments stop citing the landed
  `connection-pool-pinned-sync-checkout-per-checkout-verify` and either drop
  the deviation note or cite the story that actually owns it.
- `scripts/stale-story-references.test.ts` stays green.
