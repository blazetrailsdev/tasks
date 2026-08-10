---
title: "Eliminate the pendingRemovalTarget parking state"
status: done
updated: 2026-07-30
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5663
claim: "2026-07-30T19:23:18Z"
assignee: "eliminate-pending-removal-target-state"
blocked-by: null
closed-reason: null
---

## Context

PR #5651 removed `removeTargetBang`'s extra `target` parameter, but the
deviation it encoded still exists as instance state: `pendingRemovalTarget`
(`packages/activerecord/src/associations/has-one-association.ts`), which
`detachDisplacedTarget` sets immediately before calling `removeTargetBang` and
`removeTargetBang` consumes on entry (before its first `await`, so it is never
live across a suspension point).

Rails has no such field: `remove_target!` runs inline inside `replace`'s
transaction (`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:68-70`),
where `self.target` IS the displaced record. Our deferred displacement paths
run after the replacement is already cached, hence the parked record.

`detachDisplacedTarget` is still novel surface (`pnpm parity:api:extra` lists it for
`associations/has-one-association.ts`). Converging it means the deferred
callers — the `build#{name}`/`create#{name}` accessors and the
nested-attributes writer — displace through the same awaited path
`persistImmediate` uses, so the removal always acts on `this.target` with no
parked state at all.

## Acceptance criteria

- [ ] `pendingRemovalTarget` is gone; `removeTargetBang` reads `this.target`
      only.
- [ ] `detachDisplacedTarget` is either removed or no longer needs to name a
      record the association is not currently caching.
- [ ] `has-one-associations.test.ts`,
      `has-one-sync-build-displacement.trails.test.ts`,
      `nested-attributes-displaced-removal-failure.trails.test.ts` and
      `has-one-through-associations.test.ts` pass unchanged.
