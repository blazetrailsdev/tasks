---
title: "converge the exclusive sweep's @now_connecting exit guard"
status: done
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 30
pr: trails#8016
claim: "2026-09-23T20:53:28Z"
assignee: "connection-leasing-queue-internal-poll-carries-a-promise-arm"
blocked-by: null
closed-reason: null
---

## Context

`attempt_to_checkout_all_existing_connections`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:764-766`)
stops looping when `collected_conns.size == @connections.size && @now_connecting == 0`.
The trails port in `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
(`attemptToCheckoutAllExistingConnections`, merged in trails#7846) checks only the size, because
the pool has no `@now_connecting` counter. Rails increments that counter around
`checkout_new_connection` in `try_to_checkout_new_connection` (`connection_pool.rb:~1000-1020`),
outside the monitor, so the sweep also waits for connects that are still in flight.

## Acceptance criteria

- `ConnectionPool` carries `_nowConnecting`, incremented and decremented around
  `checkoutNewConnection` in `tryToCheckoutNewConnection`, matching Rails' `ensure` block.
- The sweep's exit guard reads `collectedConns.length === this._connections.length && this._nowConnecting === 0`.
