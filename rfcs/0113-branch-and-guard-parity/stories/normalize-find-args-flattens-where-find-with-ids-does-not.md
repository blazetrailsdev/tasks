---
title: "normalizeFindArgs recursively flattens simple-PK ids where Rails' find_with_ids does not"
status: draft
updated: 2026-09-10
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
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

Surfaced by trails#7663. `normalizeFindArgs`
(`packages/activerecord/src/relation/finder-methods.ts`) flattens simple-PK ids
recursively — `compactUniqIds(args.flat(Infinity))` for the variadic arm and
`compactUniqIds(first.flat(Infinity))` for the array arm — and its trails test
`find([[1, 2]]) → recursively flattened (Rails Array#flatten semantics)` pins
that.

Rails' `find_with_ids`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:492-502`)
does not flatten:

```ruby
expects_array = ... ids.first.is_a?(Array)
return [] if expects_array && ids.first.empty?
ids = ids.first if expects_array
ids = ids.compact.uniq
```

So `find([1, 2], 3)` in Rails has `ids = [[1, 2], 3]` (size 2 → `find_some`
with a nested Array id), and `find([[1, 2]])` has `ids = [[1, 2]]` (size 1 →
`find_one([1, 2])`); trails flattens both to `[1, 2, 3]` / `[1, 2]`.

## Converged shape

The simple-PK arm mirrors `find_with_ids` line for line: one level of
`ids.first` unwrapping when `expects_array`, then `compact.uniq`, no
`flat(Infinity)`. Whatever `where(primary_key => nested_array)` does downstream
is Rails' behaviour and should surface unchanged.

## Acceptance criteria

- [ ] No `flat(Infinity)` in `normalizeFindArgs`; the simple-PK arm matches
      `finder_methods.rb:492-502`.
- [ ] The trails tests pinning recursive flattening are corrected to Rails'
      shape (names unchanged or removed, not reworded).
- [ ] Finder suites green on all three adapters.
