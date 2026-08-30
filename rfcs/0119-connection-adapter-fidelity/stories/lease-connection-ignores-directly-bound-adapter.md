---
title: "leaseConnection ignores a directly-bound _adapter that connection and withConnection honour"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
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

trails' three connection readers disagree about a directly-bound `_adapter`:

- `connection` honours it — `if ((this as any)._adapter) return (this as any)._adapter;`
  (`connection-handling.ts:365`).
- `withConnection` honours it — `leasablePool()` returns `null` for a model with
  `_adapter` set, so the body runs against `connection.call(this)`
  (`connection-handling.ts:294-321`).
- `leaseConnection` does NOT — it is a bare
  `connectionPool.call(this).leaseConnection()` (`connection-handling.ts:287-289`),
  so it reaches the shared per-worker pool no matter what the model is bound to.

Ruby has one resolution path: `lease_connection` is
`connection_pool.lease_connection` (`activerecord/lib/active_record/connection_handling.rb:309`)
and `with_connection` is `connection_pool.with_connection`
(`connection_handling.rb:313`) — both through the pool, with no `_adapter`
concept at all. `_adapter` is a trails invention, so the divergence is that two
of the three readers grew a bypass and the third did not, leaving a silent
split-brain rather than one story.

This is not theoretical. In PR #7253 the two
`added deferrable initially immediate …` cases issued
`SET CONSTRAINTS … DEFERRED` through `Model.leaseConnection()` on an
`_adapter`-bound model. It compiled, it ran, and it landed on a *different
session* than the transaction and the inserts (which go through `withConnection`
and so honour the binding), so the deferral silently did nothing and the
constraint fired immediately. Both cases red only on the PG lane; the SQLite and
MySQL lanes skip them, and nothing locally catches it.

`scripts/non-transactional-row-writes.ts` now carries a doc comment on
`SHARED_CONNECTION_ACCESSORS` recording this asymmetry, because its accessor scan
depends on it.

## Converged shape

One resolution path. Either `leaseConnection` consults `_adapter` the way
`connection` and `withConnection` do, or — better, and the direction the rest of
the repo is moving — `_adapter` stops being a reader bypass at all and a
directly-bound model resolves through a real single-connection pool, so all three
readers go through `connectionPool` exactly as `connection_handling.rb:309,313`
do. Whichever is chosen, a model bound to an adapter must not hand back two
different sessions depending on which reader the caller happened to name.

Related: [[constraint-suites-off-bespoke-scratch-database]] (the suite whose
`_adapter` binding surfaced this).

## Acceptance criteria

- `connection`, `leaseConnection` and `withConnection` resolve to the same
  underlying session for a model with `_adapter` set — pinned by a test that
  fails on today's `main`.
- No call site has to know which of the three honours the binding.
- If the bypass is retired in favour of a real pool, the `leasablePool` null-return
  branch (`connection-handling.ts:315-321`) and the `_adapter` early return
  (`:365`) go with it.
- All three adapter lanes green; `pnpm parity:api:calls` and
  `pnpm parity:api:calls:args` stay green.
