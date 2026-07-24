---
title: "threadsafe-fallback test compiles two ToSql visitors instead of exercising superclass fallback"
status: done
updated: 2026-07-24
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 25
pr: 5194
claim: "2026-07-24T00:42:13Z"
assignee: "threadsafe-fallback-test-does-not-exercise-fallback"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DispatchContaminationTest` "is threadsafe when implementing superclass
fallback" (`vendor/rails/activerecord/test/cases/arel/visitors/dispatch_contamination_test.rb:62-75`)
races two threads through `DummyVisitor` (dispatch_contamination_test.rb:8-32):
both accept a `DummySubNode` whose own dispatch entry is absent, a
`CyclicBarrier` in an overridden `send` forces both to fail dispatch
simultaneously, and the test asserts both still resolve to the
`DummySuperNode` handler (42) — i.e. concurrent dispatch-cache correction is
safe.

trails' port (`packages/arel/src/visitors/dispatch-contamination.test.ts`,
second `it`) is a stand-in: it compiles two independent `ToSql` visitors over
`users.id.eq(...)` nodes and asserts the SQL — no subclass, no fallback, no
concurrency, no dispatch-cache write at all. PR #5095 converged the first
test in the file ("dispatches properly after failing upwards") onto the real
`Visitor` + `dispatchCache()` machinery (`visitor.ts` `resolveDispatch`
ancestor fallthrough + memoization, portable since #5046); the same approach
can make this test exercise real fallback resolution. JS is single-threaded so
the barrier/race is not portable literally — the portable core is: two visitor
instances of a `Visitor` subclass whose handler is registered on an ancestor
class, both accepting a sub-node, both resolving 42 via fallthrough, with the
memoized correction landing per-class, not per-instance.

## Acceptance criteria

- [ ] "is threadsafe when implementing superclass fallback" drives real
      `Visitor` subclass fallback (ancestor-registered handler, sub-node
      accept, memoized correction), not two unrelated ToSql compiles.
- [ ] Justify the non-portable thread/barrier machinery at the call site.
- [ ] Test name unchanged; test:compare delta non-negative.
