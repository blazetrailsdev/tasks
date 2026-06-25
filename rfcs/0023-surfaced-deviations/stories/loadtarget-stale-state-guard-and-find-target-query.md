---
title: "load_target: mirror Rails @stale_state guard and query on stale (drop in-memory cache short-circuit)"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4112
claim: "2026-06-25T12:49:45Z"
assignee: "loadtarget-stale-state-guard-and-find-target-query"
blocked-by: null
---

## Context

`Association#load_target` (`packages/activerecord/src/associations/association.ts`)
gates its refetch on `if (this.isStaleTarget() || this.findTargetNeeded())`,
but Rails gates on `(@stale_state && stale_target?) || find_target?`
(vendor/rails/activerecord/lib/active_record/associations/association.rb:190).
The `@stale_state &&` truthiness factor is missing: trails refetches whenever
`isStaleTarget()` is true regardless of whether the captured stale state was
itself truthy (nil).

Additionally, trails' `loadTarget` consults `doFindTarget()` (the in-memory
`_associationCache` / `_preloadedAssociations` short-circuit) even on the stale
branch, returning the stale cached target — whereas Rails' `find_target` always
issues a query. This is why the singular **reader** (PR #3924,
singular-reader-stale-target-check) had to call `reload()` (reset → loadTarget)
rather than `loadTarget()` directly to force a re-query on staleness.

Surfaced during PR #3924 review. The reader path is now Rails-faithful, but the
other `loadTarget` callers — `asyncLoadTarget` (association.ts) and the autosave
paths — still skip the `@stale_state &&` half of Rails' guard and can return a
stale in-memory target.

## Acceptance criteria

- [ ] `loadTarget` mirrors Rails' `(@stale_state && stale_target?) || find_target?`
      guard (association.rb:190), including the `@stale_state` truthiness factor
      with Ruby semantics (nil/false falsy; `0`/`""` truthy — i.e. `!= null`,
      not `Boolean()`).
- [ ] On the stale branch, `find_target` issues a query rather than returning
      the stale `doFindTarget()` cache, matching Rails `find_target`.
- [ ] `asyncLoadTarget` and autosave callers go through the corrected guard.
- [ ] Existing inverse-associations / strict-loading / autosave suites stay green;
      test:compare delta non-negative.
