---
title: "fix: counterCacheColumn() does not memoize like Rails @counter_cache_column ||="
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `ActiveRecord::Reflection#counter_cache_column` memoizes its result:
`@counter_cache_column ||= begin … end` (vendor/rails/activerecord/lib/active_record/reflection.rb:244-256).

Trails `counterCacheColumn()` (packages/activerecord/src/reflection.ts:323)
does NOT memoize — it re-runs a live `modelRegistry.get(klassName)` and inverse
`hasMany` scan on every call. This is intentional today: the registry-based
demodulize emulation (flat class names like `CpkBook` vs Rails' `Cpk::Book`)
must avoid caching a stale klass when a target class is re-defined between
tests, and PR #3696 deliberately relies on re-resolution at flush time. So a
naive `@counter_cache_column ||=` port would reintroduce the stale-cache bug.

Surfaced in review of PR #3696 (cpk-counter-cache-columns-pending-flush).

## Acceptance criteria

- Decide whether trails can memoize `counterCacheColumn()` (matching Rails)
  without reintroducing the stale-klass-cache problem across test re-definitions
  — e.g. memoize only once the target is registered, or invalidate on
  re-registration.
- If memoization is safe, add it; otherwise document why trails deliberately
  re-resolves (tracked-pending-convergence) and converge if/when flat class
  names are namespaced.
- No regression in counter-cache.test.ts / associations.test.ts.
