---
title: "acquireConnectionSync fires reap() fire-and-forget and cannot await its checkin/remove tail"
status: blocked
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: null
claim: "2026-09-23T20:53:28Z"
assignee: "connection-leasing-queue-internal-poll-carries-a-promise-arm"
blocked-by: "Neither AC outcome is reachable. (1) Retiring acquireConnectionSync leaves withConnectionSync serving only an already-leased connection, but its 11 sync callers (Relation#arel, execMainQuery, loadAsync, find_with_ids, attributes.ts:85, base.ts:3123, model-schema.ts:29, alias-tracker.ts:91, ...) build with nothing leased, and RFC 0152 Non-goals keep that path. (2) The PERMANENT-receipt arm ratifies a sync lease, which CLAUDE.md 'Schema reflection peeks at a warm cache' scope boundary forbids ('stay CONVERGEABLE ... Nothing here is a receipt for a new sync lease'). Needs an owner ruling reconciling RFC 0152 Non-goals with that boundary. Measured on trails#8016."
closed-reason: null
---

## Context

Found while porting `ConnectionPool#reap` (story `port-connection-pool-reap-body`,
PR trails#7860).

Rails' `acquire_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:862-880`)
calls `reap` synchronously and only retries afterward — `reap` has completed,
including its `conn.reset!` + `checkin` / `remove` tail, before the retry poll
runs. trails' `acquireConnectionSync`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:548-567`)
is `@noRailsEquivalent PERMANENT` — it exists only because JS has no
synchronous `await`, so a caller of the async `checkout` can't get a
connection back synchronously. It fires `reap()` fire-and-forget
(`void this.reap().catch(...)`) and immediately retries the poll: `reap()`'s
checkin-or-remove tail (`active()`/`resetBang()`, both async) cannot complete
before that retry, so a full pool whose only capacity is a dead owner's
connection cannot recover through this path before its `ConnectionTimeoutError`.

## Converged shape

RFC `0152-pool-checkout-async-convergence` already covers this exact method by
name (`README.md`, "The synchronous exclusive-access acquire" /
Non-goals): it keeps `acquireConnectionSync` as the sync scope backing
`withConnectionSync`, whose callers are the ratified sync `arel`/`to_sql` path
(CLAUDE.md § "`Relation` is evaluated by an async query"). The convergence is
not "make `acquireConnectionSync` await `reap()`" — that is not achievable in
JS without a blocking primitive this repo does not have — it is retiring the
sync seam itself wherever Rails is only synchronous because Ruby's I/O is, per
that RFC's Design §1–§3 and its rollout stories
(`converge-sync-connection-lease-per-checkout-verify`,
`connection-leasing-queue-internal-poll-carries-a-promise-arm`).

## Acceptance criteria

- Either `acquireConnectionSync`'s only remaining caller (`withConnectionSync`)
  moves onto the async `checkout` path per RFC 0152's design, retiring this
  method entirely, or the RFC's Non-goals are revisited to explicitly own this
  gap with a `@noRailsEquivalent PERMANENT` receipt citing RFC 0152 directly
  at `connection-pool.ts:544-547`.
- No change makes `acquireConnectionSync` itself await anything — that
  contradicts its reason for existing.
