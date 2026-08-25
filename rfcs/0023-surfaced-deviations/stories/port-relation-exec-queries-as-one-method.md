---
title: "Port Relation#exec_queries as a single method instead of spreading it across load paths"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: relation.ts:1121 now has execQueries as a single method (skipQueryCacheIfNecessary -> execMainQuery -> instantiateRecords -> preloadAssociations -> readonly/strictLoading flags, per relation.rb:1417-1418), _executeEagerLoad and _preloadAssociationsForRecords are gone, and the exec_queries -> preload_associations call-set exclude row is gone. A separate 'args' row for the extra preload-spec parameter remains as its own tracked deviation."
---

## Context

`vendor/rails/activerecord/lib/active_record/relation.rb` defines
`exec_queries(&block)` as one method that instantiates records, applies
readonly/strict_loading, calls `preload_associations(records)`, freezes and
returns `@records`.

`packages/activerecord/src/relation.ts` has **no** `execQueries`. That body is
spread across `load`, `_executeEagerLoad` and their fallback arms, each of which
separately calls `preloadAssociations`. The Ruby method has no TS counterpart to
compare, so nothing guards its ordering as a unit.

Surfaced by PR #5331: once `_preloadAssociationsForRecords` was renamed to
`preloadAssociations` (Rails' name), the wide call-ratchet began flagging
`exec_queries -> preload_associations`; baselined with a reason in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`.

## Acceptance criteria

- `execQueries` exists in `relation.ts` as a single method mirroring Rails'
  instantiate -> flags -> preload -> freeze sequence, with the existing load
  paths routed through it.
- The `exec_queries -> preload_associations` wide-exclude entry is removed.
- Relation and eager-loading suites pass unchanged.
