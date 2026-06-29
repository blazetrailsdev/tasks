---
title: "attribute-types-subclass-column-inclusive"
status: claimed
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-29T11:46:10Z"
assignee: "attribute-types-subclass-column-inclusive"
blocked-by: null
---

## Context

Rails' `attribute_types` is column-inclusive: for any class it returns a type
for every column plus declared attributes
(`activemodel/lib/active_model/attribute_registration.rb`), so
`attributes_test.rb:171-184` ("caches are cleared") asserts
`klass.attribute_types.length == klass.columns.length + 1` for an anonymous
`Class.new(OverloadedType)`.

trails diverges: `attributeTypes()` (`packages/activemodel/src/attribute-registration.ts:185`,
backed by `_defaultAttributes().castTypes()`) returns only the _declared_
attributes for an anonymous subclass — even after `loadSchemaFromAdapter.call(Klass)`
— omitting the schema-reflected columns. Observed during the
`attributes-test-cluster` port (PR #4199): for `class Klass extends OverloadedType {}`,
`Klass.columns().length === 8` but `Object.keys(Klass.attributeTypes()).length === 4`,
whereas `columnDefaults`/`attributeNames` correctly returned 9.

The "caches are cleared" test was ported against the column-inclusive analogues
(`columnDefaults` / `attributeNames`) with a deviation note; restoring the
Rails-faithful `attributeTypes`-based assertion needs the underlying fix.

## Acceptance criteria

- [ ] `attributeTypes()` on a subclass includes schema-reflected columns after the
      schema is loaded, matching Rails `attribute_types` (column-inclusive).
- [ ] The "caches are cleared" test in
      `packages/activerecord/src/attributes.test.ts` is restored to assert
      `Object.keys(Klass.attributeTypes()).length === columnCount + 1` (and `+ 2`
      after adding `wibble`).
- [ ] No regression in api:compare / test:compare.
