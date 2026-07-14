---
title: "Ignored columns should never populate the instance attribute set (Rails removes them from @attributes)"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced in PR #4861 (record-dynamic-reader-for-select-aliases). Rails removes
`ignored_columns` from the schema entirely, so their values NEVER enter
`@attributes` — `attribute_method?`/method_missing's `@attributes.key?` gate
returns false for them (activemodel/lib/active_model/attribute_methods.rb:541-543;
activerecord/lib/active_record/model_schema.rb, `columns_hash.except(*ignored_columns)`).

trails diverges: an ignored column is still a declared attribute definition and
its value stays in the instance `_attributes` set after a load — only
`columnNames()`/`columnsHash` filter ignored columns at the read layer. This
forced PR #4861's `defineDynamicSelectReaders` to gate on `_attributeDefinitions`
(which retains ignored columns) rather than `columnNames()` to avoid mistaking an
ignored column for a bare select alias (regression at base.test.ts:1689,
`"secret" in u` expected false after reload).

The underlying deviation — ignored columns present in the instance attribute set
— is latent and may surface elsewhere (serialization/`attributes` hash,
`readAttribute` returning a value for an ignored column, dirty tracking). Worth
converging so trails matches Rails' "ignored columns never populate @attributes".

trails: packages/activerecord/src/model-schema.ts (columnNames/ignored filter),
packages/activerecord/src/attribute-methods.ts (generateConcreteAttributeMethods
ignored skip), packages/activerecord/src/inheritance.ts:626 (workaround gate).

## Acceptance criteria

- Loaded records do NOT carry ignored-column keys in their instance attribute
  set (`_attributes.keys()` excludes ignored columns), matching Rails where
  `@attributes.key?("<ignored>")` is false.
- `readAttribute("<ignored>")` and `"<ignored>" in record` behave as Rails does
  for a column that was never in `@attributes`.
- Once ignored columns are absent from the attribute set, revisit whether
  `defineDynamicSelectReaders` can gate on `columnNames()` again (the more
  natural surface) instead of `_attributeDefinitions`.
