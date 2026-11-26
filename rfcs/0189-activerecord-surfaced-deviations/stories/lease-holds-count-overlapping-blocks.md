---
title: "lease-holds-count-overlapping-blocks"
status: blocked
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps:
  - lease-shape-for-overlapping-async-blocks
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T19:44:44Z"
assignee: "lease-holds-count-overlapping-blocks"
blocked-by: "awaits design story lease-shape-for-overlapping-async-blocks (operator deferred 2026-11-26; per-block fork regresses nested and concurrent leases)"
closed-reason: null
---

## Context

trails#10785 converged `withConnection` / `leaseConnection` onto
`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-427`
(the lease holds the pending checkout promise). Left over is the module-private
`leaseHolds` WeakMap in
`packages/activerecord/lib/connection-adapters/abstract/connection-pool.ts`
(~:194), used by `leaseConnection`, both `withConnection` arms,
`withConnectionSync`'s promise blocks and `adoptConnection`. It counts holders
so the lease returns to the pool only when the last overlapping async block
settles; Rails needs none because a lease belongs to one thread
(`release_connection(lease) unless lease.sticky` in the else branch's ensure).
Receipted `@inventedArm if — CONVERGEABLE lease-holds-count-overlapping-blocks`
on `withConnection`.

## Acceptance criteria

- `leaseHolds` is deleted, or the operator rules it PERMANENT (a lease shared
  by overlapping async blocks in one context is a language/runtime fact) and
  the receipt becomes `PERMANENT` with a CLAUDE.md citation.
- `withConnection`'s ensure follows `connection_pool.rb:405-427` branch for branch.
- Overlapping-lease tests in `connection-pool` trails tests stay green.
