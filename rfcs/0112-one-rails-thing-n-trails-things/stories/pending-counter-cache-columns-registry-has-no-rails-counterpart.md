---
title: "pendingCounterCacheColumns staging map + thunks + three-way key matching have no Rails counterpart"
status: ready
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails resolves a `belongs_to ..., counter_cache:`'s target with a constant
lookup at callback-build time and unions the derived column straight onto the
target class (`associations/builder/belongs_to.rb:39-41`):

```ruby
klass = reflection.class_name.safe_constantize
klass._counter_cache_columns |= [cache_column] if klass && klass.respond_to?(:_counter_cache_columns)
model.counter_cached_association_names |= [reflection.name]
```

There is no staging step: if the constant does not resolve, nothing is
recorded.

trails cannot do that — the target may not be in the model registry yet — so it
carries a whole trails-only staging apparatus with no Rails counterpart:

- `packages/activerecord/src/counter-cache-state.ts` —
  `pendingCounterCacheColumns`, a module-global
  `Map<string, Set<() => string>>` keyed by target class name, holding _thunks_
  so the column is re-derived after the target registers.
- `packages/activerecord/src/counter-cache.ts` — `getCounterCacheColumns()`
  matches pending keys three ways (exact class name, `_registryKeys` aliases,
  and a `"::ClassName"` suffix), then unions the flushed columns onto
  `_counterCacheColumns`. Entries are deliberately never removed so a
  re-registered class re-flushes.
- `packages/activerecord/src/counter-cache.ts` —
  `flushPendingCounterCacheColumns()`, called from `associations.ts:389,402`
  (`registerModel`) and from `associations/builder/belongs-to.ts:102`.

PR #6782 converged the _storage_ (`_counterCacheColumns` and
`counterCachedAssociationNames` are now `classAttribute()` arrays updated with
`|=`, mirroring `counter_cache.rb:9-10`) but left this staging layer intact.

## Converged shape

Investigate whether the model registry can be made to resolve the target at
builder time the way `safe_constantize` does — in which case
`belongs_to.rb:39-41` ports literally and the whole pending map, its thunks,
its three-way key matching and its flush callers all go.

If it genuinely cannot (a belongs_to declared before its target's module is
evaluated is a real ESM ordering constraint Ruby's autoload does not have),
then the staging layer is a language shortcoming — but it should be reduced to
the minimum that constraint forces, documented at one call site, and the
`respond_to?(:_counter_cache_columns)` guard of `belongs_to.rb:40` should be
what it mirrors, rather than the current three-way name matching.

## Acceptance criteria

- Either `counter-cache-state.ts` is gone and `belongs_to.rb:39-41` is ported
  literally, or the residue is a single documented deferral with the Rails
  guard shape and no `_registryKeys` / `"::Name"` suffix matching.
- `counter-cache.test.ts`, `counter-cache.trails.test.ts` and
  `associations/belongs-to-associations.test.ts` stay green.
- `pnpm parity:api:extra --package activerecord` reports no new novel surface.
