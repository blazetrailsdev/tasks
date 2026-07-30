---
title: "Eliminate removeTargetBang's extra target parameter"
status: done
updated: 2026-07-30
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5651
claim: "2026-07-30T17:53:16Z"
assignee: "eliminate-remove-target-bang-extra-target-param"
blocked-by: null
closed-reason: null
---

## Context

`HasOneAssociation#removeTargetBang`
(`packages/activerecord/src/associations/has-one-association.ts:649`) carries a
second parameter Rails' `remove_target!(method)` does not have
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:95`).
It defaults to `this.target` — the Rails shape, used by `persistImmediate`
(:139) — but `detachDisplacedTarget` (:503) passes the displaced record
explicitly, because the deferred displacement paths run while `this.target` is
already the replacement and flipping the cached target back mid-await would be
observable to synchronous readers.

PR #5644 ported the method onto the class and justified the parameter at the
declaration; eliminating it needs the deferred call sites converged so that
removal always acts on `this.target`, as Rails' inline removal inside `replace`
does.

## Acceptance criteria

- [ ] `removeTargetBang` takes only `method`, matching Rails' arity exactly.
- [ ] `detachDisplacedTarget` and its callers present the displaced record as
      `this.target` for the duration of the removal without that being
      observable to synchronous readers (or are restructured so the removal is
      inline, as in Rails' `replace`).
- [ ] `has-one-associations.test.ts`,
      `has-one-sync-build-displacement.trails.test.ts`,
      `nested-attributes-displaced-removal-failure.trails.test.ts` and
      `has-one-through-associations.test.ts` pass unchanged.
