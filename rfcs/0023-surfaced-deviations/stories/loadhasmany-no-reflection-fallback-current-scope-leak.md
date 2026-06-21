---
title: "loadHasMany no-reflection fallback leaks class current_scope via targetModel.all()"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 3765
claim: "2026-06-21T02:15:26Z"
assignee: "loadhasmany-no-reflection-fallback-current-scope-leak"
blocked-by: null
---

## Context

Follow-up surfaced while merging PR #3498
(`has-many-current-scope-isolation`, RFC 0030). That PR converged
`buildHasManyRelation` and the reflection-routed `loadHasMany` path to build
association reads from `_scopeForAssociation(targetModel)` (Rails'
`klass.scope_for_association`), so an enclosing `Model.where(...).scoping`
block no longer leaks the class `current_scope` into has_many reads.

However, the **inline no-reflection fallback** branches in `loadHasMany`
(`packages/activerecord/src/associations.ts:1440`, `:1443`, `:1448`) still
build from `targetModel.all()`, which returns the enclosing scoping block's
`current_scope`. So a has_many read whose reflection is NOT registered
(lower-level test helpers) still leaks `current_scope` — diverging from Rails
and from the now-converged reflection path.

Rails always builds association readers via `scope_for_association`
(named.rb), which applies only default scopes, never `current_scope` (unless
flagged `all_queries: true`).

## Acceptance criteria

- The no-reflection fallback branches in `loadHasMany` build from
  `_scopeForAssociation(targetModel)` (matching the reflection path), not
  `targetModel.all()`.
- A test exercising a no-reflection has_many read inside a
  `Model.where(...).scoping` block does not leak `current_scope`.
