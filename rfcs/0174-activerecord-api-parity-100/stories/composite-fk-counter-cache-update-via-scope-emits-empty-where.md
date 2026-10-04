---
title: "activerecord: composite-FK belongs_to counter cache emits WHERE () when the target is not loaded"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while writing the regression test for trails PR 8499. Creating a record whose composite-FK `belongs_to` has a counter cache, with the foreign key columns assigned directly and no target loaded, emits an empty predicate:

```ts
await CpkOrder.create({ id: [5, 6] });
await CpkBook.create({ id: [7, 8], shop_id: 1, order_id: 6 });
// SQLite3::SQLException: near ")": syntax error:
// UPDATE "cpk_orders" SET "books_count" = COALESCE("books_count", 0) + ? WHERE ()
```

It fails the same way on main before that PR. `(order as any).books.create(...)` works, because the target is loaded and the `increment!` arm runs.

The path is `BelongsToAssociation#update_counters` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/belongs_to_association.rb:109-117`), whose unloaded-target arm is `update_counters_via_scope(klass, owner._read_attribute(reflection.foreign_key), by)` (`:114`), then `klass.unscoped.where!(primary_key(klass) => foreign_key)` (`:119-122`). trails' port (`packages/activerecord/src/associations/belongs-to-association.ts`, `updateCounters` / `updateCountersViaScope`) calls `_readAttribute(this.reflection.foreignKey() as string)`; for a composite key that is an Array, it answers `undefined`, and `where!` over an Array key with no value renders `WHERE ()`.

Not yet established: what Rails does here. `_read_attribute` with an Array name may answer `nil` in Rails too, in which case this is a Rails bug mirrored faithfully and the story closes with that evidence. Run `Cpk::Book.create!(id: [7, 8], shop_id: 1, order_id: 6)` against Rails 8.0.2 first.

## Acceptance criteria

- [ ] Rails 8.0.2's behaviour for the snippet above is recorded (SQL emitted, or the error).
- [ ] If Rails updates the counter, trails does too, through the same `update_counters_via_scope` body, with a test that fails on main.
- [ ] If Rails emits the same broken SQL, the story is closed with the Rails output as its reason and no trails change.
