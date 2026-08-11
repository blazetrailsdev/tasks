---
title: "pg-reset-body-under-one-lock"
status: done
updated: 2026-08-11
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6376
claim: "2026-08-11T20:48:10Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Rails' `reset!` wraps its whole body — the conditional `ROLLBACK`, `DISCARD ALL`
and `super` — in one `@lock.synchronize do…end`
(`postgresql_adapter.rb:371-381`), so no foreign query can interleave between
those statements. trails' `resetBang` is sync and cannot block, so it defers the
body behind the `_inFlightReset` promise and takes no lock at all; a query can
therefore land between ROLLBACK and DISCARD ALL, and DISCARD ALL can clobber
session state a foreign chain just set up.

Attempted in PR #6365 and REVERTED with evidence: wrapping the deferred body in
`transactionManager.synchronize` deadlocks. Several query paths await
`_inFlightReset` while ALREADY holding that lock —
`abstract-adapter.ts` `withRawConnection`'s in-lock
`awaitRawConnectionReady()`, `postgresql-adapter.ts` `_acquireFreshClient`, and
`verifyBang` — so a lock-taking reset queues behind a query that is waiting for
the reset. A pre-lock drain does not close it (TOCTOU: `resetBang` can fire
during `run()`'s `connectBang()` await), and a "do I hold the lock" guard on the
in-lock waits did not either — measured, the deadlock still reproduced.

The regression test `a query holding the lock does not wait on a reset queued
behind it` (`adapters/postgresql/postgresql-adapter.trails.test.ts`) pins the
current invariant and fails (5s timeout) against the lock-taking version.

## Acceptance criteria

- The whole reset body is atomic against foreign queries, matching Rails'
  single-lock scope, with no deadlock.
- Likely shape: collapse the two serialization mechanisms into one. The barrier
  exists only because `resetBang` cannot block; if the reset holds the lock,
  queries serialize on the lock alone and the in-lock `_inFlightReset` waits can
  go — but `awaitRawConnectionReady`'s second duty (re-opening a socket a failed
  reconfigure tore down) must be preserved; `disconnect and recover on #configure_connection
failure` in `adapter.test.ts` covers it and reds if it
  is moved wholesale.
- Both existing regression tests stay green, and the new arrangement is verified
  against the deadlock test above.

## Definition of done

PG suites green (`adapters/postgresql/**`, `connection-adapters/**`,
`adapter.test.ts`, `transactions.test.ts`) plus SQLite/MySQL for the abstract
paths; `parity:api:calls` shows the `reset!` / `synchronize` row converged.

## Verification

The `reset!` / `synchronize` call-mismatch baseline row in
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
is deleted when this lands.
