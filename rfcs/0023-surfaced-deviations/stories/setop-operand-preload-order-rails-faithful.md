---
title: "Order set-operation operand preload specs preload-first, matching Rails"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced while merging PR #4482
(converge-habtm-jointable-preloader-batch-scheduling), which made preloader
scheduling run one `Preloader` per association spec sequentially — so the ORDER
of the spec list is now observable as a query-issue sequence.

In `relation.ts` `_toArrayInner` (the preload-batch caller, near the
`preloadAssocs` construction), the primary relation's list was reordered to
`[...preload, ...includes]` to match Rails
(`vendor/rails/activerecord/lib/active_record/relation.rb:1321-1323`:
`preload = preload_values; preload += includes_values unless eager_loading?`).

BUT the adjacent set-operation branch still pushes the _other_ operand's specs as
`[...other._eagerLoadAssociations, ...other._includesAssociations,
...other._preloadAssociations]` — includes before preload, and with no Rails
source anchor (Rails has no exact analog for this trails-specific set-op preload
fallback). Now that ordering is per-spec-observable, this branch is inconsistent
with the preload-first ordering applied to the primary operand.

## Acceptance criteria

- [ ] Reconcile the set-operation operand's preload-spec order in `relation.ts`
      with Rails' preload-values-first ordering (or document why the set-op
      fallback legitimately differs, with a Rails/trails file:line anchor).
- [ ] Add/confirm a test that mixes `.preload(...)` and `.includes(...)` on a
      set-operation operand (`.union`/`.or` compound) and asserts the query
      sequence, so the ordering is pinned.
