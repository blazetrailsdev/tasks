---
title: "Converge pool disconnect/discard/flush/clearReloadable to async Rails-named methods"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["converge-connection-pool-checkout-lease-async"]
deps-rfc: []
est-loc: null
priority: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Assumptions (author was away; defaults chosen — adjust freely)

- Backlog priority: land AFTER the checkout/lease convergence
  (`converge-connection-pool-checkout-lease-async`) so the async-Rails-name
  pattern is reviewer-approved first.
- Unify the method surface only; keep the deferred-close draining semantics,
  just fold them behind the Rails-named async method rather than a separate
  `Async` twin.

## Context

Beyond the checkout/lease path, trails shadows several Rails-named synchronous
lifecycle methods with async-draining twins (each tears down synchronously, then
awaits in-flight driver `close()` promises the sync path cannot):

- `disconnectBang` vs `disconnectAsync` (connection-pool.ts:857, :891)
- `discardBang` vs `discardBangAsync` (connection-pool.ts:916, :957)
- `flush` / `flushBang` vs `flushAsync` / `flushBangAsync`
  (connection-pool.ts:1037, :1080, :1089)
- `clearReloadableConnections` / `...Bang` vs
  `clearReloadableConnectionsAsync` / `...BangAsync` (connection-pool.ts:970,
  :1014, :1022)

Rails equivalents: `ConnectionPool#disconnect!`, `#discard!`, `#flush!`,
`#clear_reloadable_connections!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`).
Each is synchronous in Rails; trails split them because driver `close()` is
async.

## Acceptance criteria

- The Rails-named lifecycle methods (`disconnectBang`, `discardBang`, `flush`,
  `flushBang`, `clearReloadableConnections`, `clearReloadableConnectionsBang`)
  become async (return Promise) with the async-draining implementation folded in;
  the non-Rails `Async` twins are deleted.
- All callers await; the connection-handler / connection-management / tasks
  callers are updated.
- Same fidelity note as the checkout story: async return type is an intentional,
  documented divergence, not a regression to be reverted.
- This is likely too large for one PR under the 500 LOC ceiling — split by
  method family (e.g. disconnect+discard, then flush+clearReloadable) into
  dep-serialized stories rather than stacked PRs, since all touch
  connection-pool.ts. This story may be re-filed as 2 sub-stories at claim time.
- No node: imports, no process., async fs only, no new runtime deps.
- Test names verbatim; test:compare delta non-negative; api:compare does not
  regress. Single PR(s) from main; no stacked PRs.
