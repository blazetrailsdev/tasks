---
title: "activerecord: class_attribute slot readers drop their invented nil guards and open-coded |= / respond_to?"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
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

trails#8384 retired the `class_attribute` storage-slot skip: `_reflections`, `_counter_cache_columns`,
`_attr_readonly` and `_destroy_association_async_job` are `classAttribute()` slots with Rails' defaults
(`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:11`, `counter_cache.rb:9`,
`readonly_attributes.rb:11`, `core.rb:24`). Several readers still carry guards and open-coded bodies
from when the slots were hand-rolled static fields that could be absent. Rails reads the slot bare.

Invented nil guards on `_reflections` (the default is `{}`, so the slot is never nil on a model class):

- `packages/activerecord/src/autosave-association.ts:325` — `record.constructor._reflections ?? {}`
- `packages/activerecord/src/reflection.ts:1874` and `:1899` — `modelClass._reflections ?? {}`
- `packages/activerecord/src/base.ts:494` — `ctor?._reflections` behind an optional-typed cast
- `packages/activerecord/src/fixture-set/table-row.ts:191` — `_reflections?` behind an optional-typed cast

Open-coded `|=` and `respond_to?` in `Builder::BelongsTo.add_counter_cache_callbacks`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/belongs_to.rb:40-41`):

    klass._counter_cache_columns |= [cache_column] if klass && klass.respond_to?(:_counter_cache_columns)
    model.counter_cached_association_names |= [reflection.name]

`packages/activerecord/src/associations/builder/belongs-to.ts:70-78` writes `respond_to?` as
`"_counterCacheColumns" in klass` and each `|=` as an `includes` check plus a spread.
`packages/activerecord/src/counter-cache.ts` `loadSchemaBang` and `flushPendingCounterCacheColumns`
build the same unions by hand. `readonly-attributes.ts` `attrReadonly` already uses ruby-compat's
`union` for `|=` (`readonly_attributes.rb:31`).

## Acceptance criteria

- [ ] Each `_reflections` reader above reads the class attribute with no `?? {}` / optional-chain guard, unless a Rails `file:line` shows the same guard.
- [ ] `belongs-to.ts` ports `respond_to?(:_counter_cache_columns)` through `rbObjRespondTo` and both `|=` through ruby-compat's `union`.
- [ ] `counter-cache.ts`'s hand-built unions go through `union` where the Rails body is `|=` (`counter_cache.rb`'s `load_schema!`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row.
