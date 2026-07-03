---
title: "collection-proxy-non-through-destroy-remove-records-parity"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Non-through `CollectionProxy#destroy`
(`packages/activerecord/src/associations/collection-proxy.ts:2675-2693`)
runs the destroy batch as a plain loop:

```ts
for (const record of modelRecords) {
  await record.destroy();
  if (record.isDestroyed()) destroyed.push(record);
}
```

This diverges from Rails' `delete_or_destroy` → `remove_records`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:401-410`)
on three points, all of which the sibling `delete()` method already implements
correctly (`collection-proxy.ts:2420-2496`):

1. **`before_remove` / `after_remove` callbacks are skipped.** Rails wraps the
   whole `before_remove` loop in `catch(:abort) { ... } || return` (abortable),
   then fires `after_remove` after the DB delete. `destroy()` fires neither.
2. **Counter cache is not decremented.** Rails' `HasManyAssociation#delete_records`
   with `:destroy` (`has_many_association.rb:127-131`) calls
   `update_counter(-records.length)` unless the inverse updates the cache.
   `destroy()` never calls `_decrementCounterCache`.
3. **Non-bang `destroy()` instead of `destroy!`.** Rails does
   `records.each(&:destroy!)` — a failed destroy raises `RecordNotDestroyed`
   and rolls back the wrapping transaction. The trails loop calls non-bang
   `record.destroy()` and silently skips a record whose `isDestroyed()` is
   false (no raise, no rollback).

Surfaced during review of PR #4496, which converged the `test_destroying*`
tests onto this exact method; the happy-path tests pass, but the callback /
counter-cache / bang behaviors are untested and divergent.

## Acceptance criteria

- [ ] Non-through `CollectionProxy#destroy` fires `beforeRemove` (abortable)
      and `afterRemove` association callbacks, matching `remove_records` and the
      sibling `delete()` implementation.
- [ ] Counter cache is decremented per Rails' `:destroy` `delete_records`
      (gated on the inverse not already updating it), mirroring `delete()`'s
      destroy strategy.
- [ ] The batch uses bang-`destroyBang()` so a failed destroy raises and rolls
      back the transaction, matching `records.each(&:destroy!)`.
- [ ] Add/port the matching Rails tests (e.g. destroy callback + counter-cache
      coverage) rather than inventing names.
- [ ] Ideally, factor the shared remove-records logic so `destroy()` and
      `delete()` do not drift again.
