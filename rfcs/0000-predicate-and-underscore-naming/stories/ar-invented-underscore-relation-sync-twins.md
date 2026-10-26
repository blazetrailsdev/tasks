---
title: "Converge invented `_` Relation helpers onto their Rails methods"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit found these invented public `_` names on Relation code:

- `_isRecordsSynchronous`: `packages/activerecord/src/relation.ts:464`, `associations/collection-proxy.ts:429`, `relation/delegation.ts:192`.
- `_isNone`: `relation/calculations.ts:137`, `relation/finder-methods.ts:48`, `relation/query-methods.ts:219`.
- `_loadResult`, `_fromLimitedIds`, `_applyEagerJoinDependency` and `_materializeDeferredDistinctPkPredicates`, at `relation.ts:353,358,1032,1105`.

The Rails counterparts are `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb` `none?` / `load` and `relation/finder_methods.rb` `apply_join_dependency` / `limited_ids_for`.

## Acceptance criteria

- [ ] Each name is inlined into, or renamed to, the Rails method it serves. Where that is impossible, it is TS-private or receipted.
- [ ] The `invented` count drops for each touched file, and the call gates stay green.
