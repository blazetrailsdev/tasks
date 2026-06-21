---
title: "PredicateBuilder respondsToId derefs any {id} object where Rails respond_to?(:id) excludes a bare Hash"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-21T19:10:42Z"
assignee: "predicate-builder-respondstoid-plain-object-divergence"
blocked-by: null
---

## Context

`PredicateBuilder#build` / `buildNegated` (and `buildNegatedArray`) detect an
Active Record instance to deref via `respondsToId`, which returns true for **any**
object carrying an `"id"` property:

```ts
function respondsToId(value: unknown): value is { id: unknown } {
  return value != null && typeof value === "object" && "id" in value;
}
```

This mirrors Rails `predicate_builder.rb:58` (`value = value.id if value.respond_to?(:id)`)
for the common case (AR records have an `id` getter), and is internally consistent
with the array handler's `"id" in item` check. But it diverges for a **bare plain
object**: in Ruby `Hash` does not `respond_to?(:id)` (Object#id was removed in 1.9),
so `where(scalar_col: { id: 5 })` in Rails routes `{ id: 5 }` to a handler, whereas
trails derefs it to `5`.

This was flagged twice in PR #3370 review and triaged as no-change (consistent with
the array handler, unusual case, not exercised by ported tests). Tracking for exact
convergence.

## Acceptance criteria

- [ ] `respondsToId` distinguishes AR record instances from plain objects, matching
      Rails `respond_to?(:id)` (a bare object literal with an `id` key is NOT deref'd).
- [ ] Apply consistently across `build`, `buildNegated`, and `buildNegatedArray`'s
      per-element record detection.
- [ ] Add a regression test mirroring a Rails test name verbatim if one exists for
      the plain-object-not-a-record case; otherwise document why none is added.
- [ ] api:compare / test:compare delta non-negative.
