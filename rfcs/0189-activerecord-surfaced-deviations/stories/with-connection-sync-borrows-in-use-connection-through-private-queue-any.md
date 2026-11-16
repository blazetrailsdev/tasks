---
title: "with-connection-sync-borrows-in-use-connection-through-private-queue-any"
status: draft
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
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
closed-reason: null
---

## Context

`ConnectionPool#withConnectionSync` (`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`, the `borrowed` arm near line 747) borrows an in-use connection that has no open transaction when `!this._available?.isAny()` and the pool is full. Rails has no such arm. `connection_pool.rb` never calls `@available.any?`, and `Queue#any?` is private (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/queue.rb:75,85-87`).

`withConnectionSync` falls under the synchronous-lease boundary in packages/activerecord/CLAUDE.md ("Schema reflection peeks at a warm cache"). It is CONVERGEABLE.

Reviewer finding on trails#10208. That PR converged `Queue#any?` to an `isAny()` method but left this caller in place.

## Acceptance criteria

- [ ] The `borrowed` arm is removed, or reshaped onto a path Rails has, so `ConnectionPool` no longer calls `Queue#isAny`.
- [ ] `Queue#isAny` becomes TS `private`, matching `queue.rb:75`.
- [ ] The connection-pool tests stay green on all three adapters.
