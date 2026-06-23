---
title: "am-attribute-set-collection"
status: in-progress
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: activemodel
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 4031
claim: "2026-06-23T19:33:10Z"
assignee: "am-attribute-set-collection"
blocked-by: null
---

## Context

`ActiveModel::AttributeSet` and its `LazyAttributeHash` builder are missing
Hash/Enumerable-style collection methods that are genuine ports (real behavior,
not metaprogramming):

- `packages/activemodel/src/attribute-set.ts` (17/21): `each_value`, `fetch`,
  `except`, `include?` —
  `vendor/rails/activemodel/lib/active_model/attribute_set.rb`.
- `packages/activemodel/src/attribute-set/builder.ts` (18/22):
  `transform_values`, `each_value`, `fetch`, `except` (on `LazyAttributeHash`).
- `packages/activemodel/src/errors.ts` (25/27): `has_key?`, `key?` — Rails
  `Errors` aliases of `include?` (errors.rb).

These iterate/lookup the underlying attribute map; trails has the backing store
already, so these are thin, real method ports.

## Acceptance criteria

- `each_value`, `fetch`, `except`, `include?` ported on AttributeSet;
  `transform_values`, `each_value`, `fetch`, `except` on LazyAttributeHash;
  `has_key?`/`key?` on Errors (alias of the existing `include?`).
- Tests matching the Rails test names (attribute_set_test.rb /
  errors_test.rb) for at least `fetch`, `except`, and the errors key lookups.
- `pnpm api:compare --package activemodel` shows attribute-set.ts,
  attribute-set/builder.ts, errors.ts at 100%.
