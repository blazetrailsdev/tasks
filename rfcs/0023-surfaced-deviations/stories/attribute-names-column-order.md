---
title: "attribute-names-column-order"
status: claimed
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-29T11:22:10Z"
assignee: "attribute-names-column-order"
blocked-by: null
---

## Context

Rails' `attribute_names` returns column order followed by virtual/declared
attributes: `assert_equal column_names + ["non_existent_decimal"], attribute_names`
(`activerecord/test/cases/attributes_test.rb:182`, test "overloading properties
does not attribute method order"). The ordering is part of the AR contract
(it drives `inspect` output and serialization key order).

trails' `attributeNames()` is `[...this._attributeDefinitions.keys()]`
(`packages/activerecord/src/attribute-methods.ts`), and `_attributeDefinitions`
keeps a user-declared override (e.g. `attribute :overloaded_float`) in its
_declaration_ slot rather than the column's schema position. So overriding a
column reorders `attribute_names` relative to `column_names`, and the appended
virtual attribute is not guaranteed last.

This surfaced while porting `attributes_test.rb` (PR #4199, story
attributes-test-cluster): the test
`packages/activerecord/src/attributes.test.ts` "overloading properties does not
attribute method order" had to weaken Rails' exact-order `assert_equal` to a
`new Set(...)` membership check.

## Acceptance criteria

- [ ] `attributeNames()` returns column order (schema positions) followed by
      declared/virtual attributes, matching Rails so a declared override of a
      column keeps the column's position.
- [ ] The test above is restored to the exact-order assertion
      (`expect(attributeNames).toEqual([...columnNames, "non_existent_decimal"])`).
- [ ] No regression in api:compare / test:compare.
