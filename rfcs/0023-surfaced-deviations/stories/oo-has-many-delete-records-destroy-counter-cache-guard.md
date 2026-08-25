---
title: "fix: OO HasManyAssociation#deleteRecords :destroy branch skips counter-cache decrement (missing inverse_updates_counter_cache? guard)"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3781
claim: "2026-06-21T12:06:48Z"
assignee: "oo-has-many-delete-records-destroy-counter-cache-guard"
blocked-by: null
---

## Context

`HasManyAssociation#deleteRecords` (the OO association layer) in
`packages/activerecord/src/associations/has-many-association.ts:143-151`
destroys each record in the `:destroy` branch but **unconditionally returns
without decrementing the owner's counter cache**, on the assumption that the
child's `belongs_to` inverse handles it (`CounterCache#destroy_row`).

Rails `HasManyAssociation#delete_records` (has_many_association.rb:129-130):

```ruby
records.each(&:destroy!)
update_counter(-records.length) unless reflection.inverse_updates_counter_cache?
```

The inverse only covers the counter when a `belongs_to` inverse points at the
**same** column. For a `has_many ... dependent: :destroy, counter_cache: :X`
whose column X differs from the inverse `belongs_to`'s counter column (e.g.
`Post.taggingsWithDestroy` → `taggings_with_destroy_count` vs the Tagging
`belongs_to :taggable` → `tags_count`), `inverse_updates_counter_cache?` is
false and Rails _does_ decrement X — but the OO path silently skips it.

PR #3738 fixed exactly this in the duplicated `CollectionProxy#delete`
fast-path by gating the decrement on
`reflection.inverseWhichUpdatesCounterCache()`. The OO `deleteRecords` reached
via `owner.destroy` (dependent: :destroy) and the association-layer `delete`
still has the un-guarded behavior. trails already exposes
`AbstractReflection#inverseWhichUpdatesCounterCache()` (reflection.ts:449).

## Acceptance criteria

- [ ] `HasManyAssociation#deleteRecords` `:destroy` branch decrements the
      owner's counter cache by `records.length` **unless**
      `reflection.inverseWhichUpdatesCounterCache()` is truthy, mirroring Rails'
      `unless reflection.inverse_updates_counter_cache?` guard.
- [ ] No double-count when the inverse DOES cover the column (existing
      same-column dependent: :destroy counter tests stay green).
- [ ] Add/port coverage for the distinct-column case via the association-layer
      destroy path (mirror the relevant Rails has_many counter-cache test).
