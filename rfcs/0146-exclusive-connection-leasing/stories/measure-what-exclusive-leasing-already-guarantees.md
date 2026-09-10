---
title: "Measure what PRs 7288 and 7056 already guarantee about concurrent entry on a leased adapter"
status: done
updated: 2026-09-10
rfc: "0146-exclusive-connection-leasing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 94
claim: "2026-09-10T18:19:36Z"
assignee: "measure-what-exclusive-leasing-already-guarantees"
blocked-by: null
closed-reason: null
---

## Context

RFC 0146 Phase 1. Six stories were blocked on the claim that trails does not
prevent concurrent entry on a leased adapter. Two of them name the prerequisites
explicitly: `abstract-adapter-lock-defaults-to-monitor-not-nulllock` says
unblocking "needs the pool to prevent concurrent entry on a leased connection —
see `synchronize-lock-barges-in-the-release-window` and
`converge-acquire-connection-blocking-wait` — not an adapter-level change", and
`server-version-barrier-takes-the-connection-lock-first` names the first of
those as its own prerequisite.

Both have since landed — `synchronize-lock-barges-in-the-release-window` as
PR 7288 and `converge-acquire-connection-blocking-wait` as PR 7056 — and no one
has re-measured against main since. This story establishes what those two
actually deliver before any further design work is budgeted, because the answer
sets the size of the whole RFC: if the pool already prevents concurrent entry,
`abstract-adapter-lock-defaults-to-monitor-not-nulllock` may unblock as-is and
`server-version-barrier-takes-the-connection-lock-first` with it.

The measurement is the reproduction the blocker names:
`packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.trails.test.ts:322`
("reads currval on the session that ran its own INSERT"), plus the three
serialization cases in `abstract-adapter.lifecycle.trails.test.ts`.

## Acceptance criteria

- [ ] Against current main, with `@lock` defaulted to `NullLock`
      (`abstract_adapter.rb:157`, the setter's `else` arm at `:181-192`), record
      pass/fail for `postgresql-adapter.exec-query.trails.test.ts:322` and the
      three `abstract-adapter.lifecycle.trails.test.ts` serialization cases, on
      the PG and SQLite lanes.
- [ ] State, with the pool code in hand, whether a checked-out adapter can still
      be entered concurrently after PRs 7288 and 7056 — and if so, name the
      exact path that reaches it.
- [ ] Update `abstract-adapter-lock-defaults-to-monitor-not-nulllock` and
      `server-version-barrier-takes-the-connection-lock-first`: unblock via
      `tasks status-set` if the measurement clears them, or rewrite each
      `blocked-by` to the residual that survives.
- [ ] Record the result in RFC 0146's Rollout so Phases 2-4 are sized against
      it rather than against the original assumption.

## Definition of done

A narrative reading of the pool code does not close this story — the four named
test cases must actually be run with the `NullLock` default in place, on both
lanes, and their output recorded.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.trails.test.ts`
and
`pnpm vitest run packages/activerecord/src/connection-adapters/abstract-adapter.lifecycle.trails.test.ts`,
each with the `NullLock` default patched in locally, on the PG and SQLite lanes.

## Notes

This is a measurement story, not a convergence: it may end with no production
diff at all. That is a successful outcome if the blocked-by rewrites are
specific.
