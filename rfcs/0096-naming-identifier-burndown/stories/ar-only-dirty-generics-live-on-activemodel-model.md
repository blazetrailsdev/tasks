---
title: "Move the ActiveRecord-only dirty generics off ActiveModel::Model onto Base"
status: in-progress
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6821
claim: "2026-08-21T14:20:44Z"
assignee: "retire-collection-proxy-raise-on-type-mismatch"
blocked-by: null
closed-reason: null
---

# Move the ActiveRecord-only dirty generics off ActiveModel::Model onto Base

## Context

`ActiveModel::Dirty` defines only `attribute_changed?`, `attribute_change`,
`attribute_was`, `attribute_previously_changed?`, `attribute_previous_change`,
`attribute_previously_was`, `attribute_will_change!`, `restore_attribute!` and
`clear_attribute_change` (`activemodel/lib/active_model/dirty.rb`). The
`saved_change_to_*` / `*_before_last_save` / `*_in_database` family is
ActiveRecord's, defined in
`activerecord/lib/active_record/attribute_methods/dirty.rb:150-240`.

trails puts four of those AR-only generics on `ActiveModel`'s `Model`:

- `savedChangeToAttribute` — packages/activemodel/src/model.ts:2251
  (overridden on Base, packages/activerecord/src/base.ts:1994)
- `attributeBeforeLastSave` — packages/activemodel/src/model.ts:2272
- `attributeInDatabase` — packages/activemodel/src/model.ts:2284
- `willSaveChangeToAttribute` — packages/activemodel/src/model.ts:2209

plus `savedChangeToAttributeValues` (:2322) and
`willSaveChangeToAttributeValues` (:2229).

PR #6814 declared the matching `attribute_method_affix` / `attribute_method_suffix`
patterns in the Rails-correct place — `Base`'s `attributeMethodPatterns` static
block, mirroring dirty.rb:53-59 — so the patterns and their proxy targets now
live in different packages. `packages/activerecord/src/attribute-methods/dirty.ts`
already holds standalone ports of the same names taking an explicit record.

## Converged shape

The generics move to ActiveRecord beside their pattern declarations, and
`ActiveModel`'s `Model` keeps only what `activemodel/lib/active_model/dirty.rb`
defines. `packages/activemodel/src/dirty-generated-methods.test.ts` covers the
ActiveModel half and
`packages/activerecord/src/dirty-generated-methods.trails.test.ts` the
ActiveRecord half; the split already matches the target layout.

Watch for consumers that call these on a plain `Model` — the move makes them a
type error, which is the point.

## Acceptance criteria

- [ ] `savedChangeToAttribute`, `willSaveChangeToAttribute`,
      `attributeBeforeLastSave`, `attributeInDatabase` and the two `*Values`
      readers no longer exist on `ActiveModel`'s `Model`.
- [ ] Each lands in ActiveRecord at the file its Rails counterpart lives in
      (`attribute_methods/dirty.rb`), and `Base`'s `savedChangeToAttribute`
      override collapses into the single definition.
- [ ] `parity:api` / `parity:test` deltas non-negative; `parity:api:calls` /
      `:args` add zero rows.
