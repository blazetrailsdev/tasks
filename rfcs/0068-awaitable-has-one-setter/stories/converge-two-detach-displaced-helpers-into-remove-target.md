---
title: "Converge detachDisplacedTarget / detachDisplacedRecord into one remove_target! port"
status: done
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5455
claim: "2026-07-27T21:04:16Z"
assignee: "converge-two-detach-displaced-helpers-into-remove-target"
blocked-by: null
closed-reason: null
---

## Context

Rails has ONE removal entry point for a displaced has_one: the private
`remove_target!(method)`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:95-115`),
called from `replace` (:69).

trails has three public, invented members doing that job, all counted as extra
surface by `pnpm parity:api:extra` (`associations/has-one-association.ts` — 5 novel):

- `detachDisplacedTarget(displaced, replacement)` — parks `this.target` on the
  displaced record for the duration of the removal, to reproduce Rails' "target
  stays the OLD record if `remove_target!` raises" semantics.
- `detachDisplacedRecord(displaced)` — identical guards, but does NOT park,
  because the nested-attributes writer returns to its caller mid-removal and a
  parked target would be briefly observable.
- `removeTargetBang(assoc, dependent, record?)` — the shared module function
  both delegate to.

The two `detach*` methods differ only in the parked target. Now that PR #5442
routed the load and the removal through the `loadDisplacedForBuild` /
`detachDisplacedOnBuild` hooks, the call sites are few and explicit, so the pair
may be collapsible into one method with the parking behavior derived from the
caller (or from whether the caller can await).

## Acceptance criteria

- [ ] One removal method (Rails' `remove_target!`) where there are currently
      two, or a call-site comment justifying why the split is irreducible in JS.
- [ ] `pnpm parity:api:extra` activerecord novel count DROPS (currently 579); no new
      allowlist entries.
- [ ] Existing coverage keeps passing unchanged: the target-on-failure
      invariant (`remove-target-nullify-failure-raise-untested`), the
      nested-attributes non-parking requirement, and
      `has-one-sync-build-displacement.trails.test.ts`.
