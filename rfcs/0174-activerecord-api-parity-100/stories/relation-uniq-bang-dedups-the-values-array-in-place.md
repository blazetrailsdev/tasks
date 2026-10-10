---
title: "relation-uniq-bang-dedups-the-values-array-in-place"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

`Relation#uniq!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1541-1546`) dedups the stored array in place:

```ruby
def uniq!(name)
  if values = @values[name]
    values.uniq! if values.is_a?(Array) && !values.empty?
  end
  self
end
```

trails' `uniqBang` (`packages/activerecord/src/relation/query-methods.ts:1092-1099`) assigns a fresh array instead: `this._values[name] = uniq(values)`. The reassignment predates trails#8309, which only swapped `[...new Set(values)]` for ruby-compat's `uniq`.

The difference is observable through aliasing. `Relation#initialize_copy` is `@values = @values.dup` (`relation.rb:97-100`), a shallow copy, and trails' `initializeCopy` (`packages/activerecord/src/relation.ts:1746-1753`) is the same shallow `{ ...other._values }`. So in Rails a spawned relation and its source share each value array, and `uniq!` on one dedups the array the other reads. In trails the source keeps the duplicates.

ruby-compat has `uniq` (`packages/ruby-compat/src/array.ts:469`, `rb_ary_uniq`) but no in-place `Array#uniq!` (`rb_ary_uniq_bang`, `vendor/ruby/v3.3.11/array.c:6124`), which also answers `nil` when nothing was removed.

`reorder!`'s `args.uniq!` (`query_methods.rb:762`, trails `query-methods.ts:493` `args = uniq(args)`) is the second site. There `args` is the method's own splat, so nothing aliases it, but it converges onto the same primitive.

Raised as a non-blocking review finding on trails#8309.

## Acceptance criteria

- ruby-compat gains the port of `rb_ary_uniq_bang` (`array.c:6124`): dedups by `rbHash` / `rbEql` in place, answers `null` when no element was removed, with a `@noRailsEquivalent PERMANENT` receipt and a test beside `uniq`'s.
- `uniqBang` calls it on the stored array, so the array identity in `_values[name]` is unchanged, as in `query_methods.rb:1543`.
- `reorderBang` calls it on `args` (`query_methods.rb:762`) in place of `args = uniq(args)`.
- A `.trails.test.ts` case shows a relation and its `spawn` both observing the dedup after `uniq!` on one, and fails on the current reassignment.
