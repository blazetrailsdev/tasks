---
title: "in_batches block/yield sites stop holding a stripThenable relation across awaits"
status: draft
updated: 2026-11-09
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/batches.ts:464` and `:549` call `block(stripThenable(subrelation))` / `block(stripThenable(yieldedRelation))`. The block keeps the relation across awaits, and the async-generator `yield` at `batches.ts:236` awaits the yielded value again later. Rails yields the plain relation (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb`, `in_batches` / `batch_on_loaded_relation` / `batch_on_unloaded_relation`).

Found on trails#9907 while trying `strip-thenable-lifetime-of-hidden-then`. Hiding `then` for one microtask (an own `then: undefined`, deleted by `queueMicrotask`) passed all of `relation.test.ts`, but 90 batches/has-many tests went red. The batch arrived as an array because its `then` was restored before the held value was awaited again.

## Acceptance criteria

- `in_batches`' block and enumerator sites hand over a relation that is never resolved through `then` by a later await. Either the yield path stops re-awaiting it, or the iteration protocol carries it without a promise-resolution layer. No `stripThenable` call is left in `batches.ts`.
- `batches.test.ts` stays green with `stripThenable` changed to the one-microtask hide. That unblocks `strip-thenable-lifetime-of-hidden-then`.
