---
title: "Nested-attributes collection assignment must sort hash keys numerically, not lexically"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3774
claim: "2026-06-21T03:50:42Z"
assignee: "nested-attributes-collection-numeric-key-sort"
blocked-by: null
---

## Context

Surfaced while canonicalizing `packages/activerecord/src/nested-attributes.test.ts`
(PR #3643, story `canonicalize-nested-small-blocks`).

Rails sorts a nested-attributes **collection** hash by the **numeric** value of
its keys before building new associated records:

```ruby
# vendor/rails/activerecord/lib/active_record/nested_attributes.rb
# assign_nested_attributes_for_collection_association
attributes_collection.sort_by { |i, _| i.to_i }
```

So with keys `"123726353"` and `"2"`, Rails builds the `"2"` entry first
(`2 < 123726353`). The Rails test
`test_should_sort_the_hash_by_the_keys_before_building_new_associated_models`
(`activerecord/test/cases/nested_attributes_test.rb`) asserts exactly this.

trails sorts the keys **lexicographically** (string comparison), so
`"123726353"` sorts before `"2"` — the reverse of Rails. Two test conversions
in PR #3643 had to work around this:

- "should sort the hash by the keys before building new associated models" had
  to use keys `0`/`1`/`2` (which sort identically under string and numeric
  comparison) instead of Rails' `123726353`/`2`.
- "should automatically build new associated models…" had to switch from an
  order-dependent `.first`/`.last` name assertion to an order-independent set
  comparison, because the unsaved built records come back in the divergent
  (lexical) order.

## Acceptance criteria

- Nested-attributes collection assignment sorts hash keys by numeric value
  (`Number(key)` / `to_i` semantics), matching Rails `sort_by { |i,_| i.to_i }`.
- Restore the two PR #3643 tests to their Rails-faithful forms (numeric keys
  `123726353`/`2`; order-dependent first/last name assertions) once the impl
  converges. Test names unchanged.
- No regressions in test:compare.

## Pointers

- trails impl: nested-attributes collection assignment in
  `packages/activerecord/src/nested-attributes.ts` (the `*Attributes=` collection
  writer / `assignNestedAttributesForCollectionAssociation` equivalent).
- Rails: `active_record/nested_attributes.rb#assign_nested_attributes_for_collection_association`.
