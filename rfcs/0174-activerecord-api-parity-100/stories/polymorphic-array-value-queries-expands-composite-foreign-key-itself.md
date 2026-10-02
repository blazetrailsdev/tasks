---
title: "activerecord: PolymorphicArrayValue#queries expands a composite foreign key itself instead of keying by it"
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

`PolymorphicArrayValue#queries`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder/polymorphic_array_value.rb:11-20`)
is:

```ruby
return [ associated_table.join_foreign_key => values ] if values.empty?

type_to_ids_mapping.map do |type, ids|
  query = {}
  query[associated_table.join_foreign_type] = type if type
  query[associated_table.join_foreign_key] = ids
  query
end
```

One query per type, keyed by `join_foreign_key` whatever its arity; a composite key is an Array KEY,
which `expand_from_hash`'s array-key arm (`relation/predicate_builder.rb:87-96`) then expands and
validates.

The port (`packages/activerecord/src/relation/predicate-builder/polymorphic-array-value.ts`,
`queries()`) expands a composite foreign key itself: an `Array.isArray(fk)` arm in the empty case, a
per-tuple loop that raises its own `Expected corresponding value for … to be an Array`, a
`tuple[i] ?? null` fill, and `ids.length === 1 ? ids[0] : ids` unwrapping. It returns plain objects,
which cannot carry an Array key; `expandFromHash` already takes a `Map` with an array key (the through
arm passes one since trails#8354).

## Acceptance criteria

- [ ] `queries()` is Rails' body: the `values.empty?` early return and one `map` over
      `type_to_ids_mapping`, each query a `Map` keyed by `join_foreign_key` as given.
- [ ] The composite expansion and its `ArgumentError` come from `expandFromHash`'s array-key arm only.
- [ ] `AssociationQueryValue#queries` is checked for the same shape
      (`predicate_builder/association_query_value.rb`).
