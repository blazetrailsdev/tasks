---
title: "test: cover counterCacheColumn() memo invalidation on target re-registration"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3704 added klass-identity-keyed memoization to
`AssociationReflection#counterCacheColumn()` (packages/activerecord/src/reflection.ts):
the cache hits only when `_counterCacheColumnKlass === resolvedKlass`, so a
target class re-registered between tests invalidates the memo. Existing
counter-cache.test.ts covers output values, but there is no test that directly
exercises the re-registration invalidation path (compute → re-register target →
recompute yields the new column, not the stale one).

## Acceptance criteria

- Add a test that populates the memo, re-registers the belongs_to target class
  with a different inverse hasMany shape, and asserts counterCacheColumn()
  returns the recomputed column (not the cached one).
- Test names match Rails where an analogous test exists; otherwise document as
  a trails-specific guard for the registry-resolution deviation.
