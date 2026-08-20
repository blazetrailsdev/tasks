---
title: "counter_cached_association_names is a hand-rolled Set + register helper, not classAttribute()"
status: ready
updated: 2026-08-20
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares `counter_cached_association_names` as one `class_attribute` in
the `CounterCache` Concern's `included do` block
(`vendor/rails/activerecord/lib/active_record/counter_cache.rb:9-11`):

```ruby
included do
  class_attribute :_counter_cache_columns, instance_accessor: false, default: []
  class_attribute :counter_cached_association_names, instance_writer: false, default: []
end
```

It is an **Array**, written only by `|=` — from
`Builder::BelongsTo.add_counter_cache_callbacks`
(`associations/builder/belongs_to.rb:41`,
`model.counter_cached_association_names |= [reflection.name]`) and from
`counter_cache.rb:195` (`self.counter_cached_association_names |= association_names`)
— and read directly as a method in `_create_record` (`counter_cache.rb:200-207`)
and `destroy_row` (`counter_cache.rb:209-224`).

trails splits that one class_attribute into three trails-only pieces in
`packages/activerecord/src/counter-cache.ts`:

- `_counterCachedAssociationNames`, a **`Set<string>`** hung on the class, not
  an Array and not declared through `classAttribute()`.
- `registerCounterCachedAssociation(model, name)` (counter-cache.ts:312-320),
  an exported helper with no Rails counterpart that hand-rolls copy-on-write
  (`hasOwnProperty` check, then `new Set(inherited ?? [])`) to imitate
  `class_attribute`'s "reads walk the chain, writes are local" semantics.
- `counterCachedAssociationNames(ctor)` (counter-cache.ts:322-325), a private
  module function that spreads the Set back into an Array, wrapped again by
  `getCounterCachedAssociationNames` for the `ClassMethods` table.

CLAUDE.md's "Module mixins" section already rules on this shape: an
`included do class_attribute :foo ... end` is `classAttribute()` from
`@blazetrails/activesupport` (`packages/activesupport/src/class-attribute.ts:70`),
"which already gives Rails' semantics (reads walk the constructor chain, writes
are local to the class); do not hand-roll copy-on-first-write per call site."

PR #6777 converged the read side of this cluster — it deleted the
`_associations` scan fallback and the `new Set(...)` dedupe that fallback
needed, so the registry is now authoritative. The storage shape underneath it
was left as-is and is the remaining deviation.

## Converged shape

- Declare `counterCachedAssociationNames` via `classAttribute()` in the
  CounterCache Concern's `included` callback, defaulting to `[]`, mirroring
  counter_cache.rb:10. (`_counterCacheColumns` at counter_cache.rb:9 is the
  sibling declaration — check whether it has the same problem and converge both
  if so.)
- Replace `registerCounterCachedAssociation` with the `|=` write at the two
  Rails call sites (belongs_to.rb:41 and counter_cache.rb:195). Union-assign
  against the array; `classAttribute()`'s writer already localises to the
  subclass, so the `hasOwnProperty` dance goes away with it.
- Delete `counterCachedAssociationNames(ctor)` and
  `getCounterCachedAssociationNames` — the class*attribute reader \_is* the
  method Rails calls, so there is nothing left to wrap.
- Keep the Array ordering Rails has: `|=` appends, so declaration order is
  preserved. The current Set spread happens to preserve insertion order too,
  but nothing pins it today.

## Acceptance criteria

- `_counterCachedAssociationNames`, `registerCounterCachedAssociation` and the
  private `counterCachedAssociationNames` function no longer exist.
- `counterCachedAssociationNames` is a `classAttribute()` reading `[]` by
  default, and a subclass adding a `belongs_to ..., counterCache:` does not
  mutate its parent's list.
- `pnpm parity:api:extra --package activerecord` no longer reports
  `registerCounterCachedAssociation` as novel surface.
- Green: `counter-cache.test.ts`, `counter-cache.trails.test.ts`,
  `associations/belongs-to-associations.test.ts`.
