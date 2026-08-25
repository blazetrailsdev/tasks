---
title: "Pin the no-floating-rejection property for the unloaded displacement removal"
status: done
updated: 2026-07-30
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 5665
claim: "2026-07-30T19:47:45Z"
assignee: "unloaded-displacement-removal-floating-rejection-untested"
blocked-by: null
closed-reason: null
---

## Context

`parkDisplacedRemoval` (`packages/activerecord/src/nested-attributes.ts`)
captures the rejection of a backgrounded displacement removal so a
never-drained one cannot surface as an unhandled rejection: the parked value
resolves _to_ the error rather than rejecting.

`nested-attributes-displaced-removal-failure.trails.test.ts` ("does not leave a
floating rejection when the removal is never drained") pins that property only
for the **loaded** path, which parks
`HasOneAssociation#detachDisplacedTarget`'s promise.

PR #5642 reworked the **unloaded** path: the writer now takes the
`find_target?` decision before `assoc.build` via
`HasOneAssociation#prepareDetachDisplacedForSyncBuild` and parks the thunk's
promise after the build. Both paths funnel through the same
`parkDisplacedRemoval`, so the property should hold, but nothing locks it — a
future change that parks the unloaded promise differently (or awaits between
creating and parking it) would regress silently.

## Acceptance criteria

- [ ] A trails test covers the unloaded thunk path: a never-loaded has_one on a
      persisted owner whose displacement removal rejects, assigned through the
      synchronous `#{name}Attributes` setter and never drained, leaves a
      resolved (not rejected) entry in `_pendingDisplacedRemovals`.
- [ ] Verified failing on a baseline where the unloaded promise is parked
      without rejection capture.
