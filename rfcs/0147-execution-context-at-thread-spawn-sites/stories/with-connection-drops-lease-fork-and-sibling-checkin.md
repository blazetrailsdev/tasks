---
title: "withConnection drops the lease fork and sibling-checkin arm"
status: ready
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord"]
deps:
  [
    "spawn-sites-mint-execution-context",
    "adapter-fan-out-follows-rails-sequencing",
    "association-fan-out-follows-rails-sequencing",
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0147 Design §3. Depends on `spawn-sites-mint-execution-context`,
`adapter-fan-out-follows-rails-sequencing` and
`association-fan-out-follows-rails-sequencing`. Once every Rails thread boundary
mints its own context and trails' own fan-outs run sequentially, what is left of
same-context concurrency is user code fanning out inside one flow. That is the
JS analogue of sharing one thread's connection across unisolated fibers, which
Rails does not guard.

Two trails-only guards then have no Rails counterpart:

- `withLeaseContext` (`connection-adapters/abstract/connection-pool/execution-context.ts`)
  and its fork in `ConnectionPool#withConnection` (`connection-pool.ts:607`).
- `withConnection`'s outer `finally` sibling-checkin arm (`connection-pool.ts:618-623`),
  which hands the forked lease's connection back to the caller's lease or checks it in.

Rails `with_connection` (`connection_pool.rb:405-424`) uses the thread's own lease
and ends with `release_connection(lease) unless lease.sticky` (`connection_pool.rb:421`).

## Acceptance criteria

- [ ] `withConnection` mirrors `with_connection`: no fork, no sibling-checkin
      arm; `releaseConnection(lease)` unless `lease.sticky` is the only release path.
- [ ] `withLeaseContext` deleted along with its `@noRailsEquivalent` receipt.
- [ ] Tests that relied on the fork either move into `withExecutionContext`
      (the Thread.new analogue) or are deleted if they assert trails-only behaviour.
