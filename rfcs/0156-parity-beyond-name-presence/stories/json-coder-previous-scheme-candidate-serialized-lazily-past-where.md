---
title: "json-coder-previous-scheme-candidate-serialized-lazily-past-where"
status: closed
updated: 2026-11-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-17T13:21:36Z"
assignee: "burn-down-the-declaration-only-population-remaining"
blocked-by: null
closed-reason: "FALSIFIED: Rails raises lazily too. With a previous scheme, where(name:) carries two candidates, so ArrayHandler builds Arel::Nodes::HomogeneousIn (vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder/array_handler.rb:20-23), whose casted_values calls type.serialize only when the visitor compiles the SQL (vendor/rails/v8.0.2/activerecord/lib/arel/nodes/homogeneous_in.rb:39-47). trails raises from the same frame (homogeneous-in.ts castedValues, reached from to_sql at query time). The YAML twin raises at where because AdditionalValue#process serializes eagerly with the previous type, which is also Rails' order."
---

## Context

`Relation::QueryAttribute#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_attribute.rb:8-18`)
calls `value_for_database` eagerly when `@type.serialized?`. For a deterministic
encrypted attribute that is `serialize`d, a coder failure on a previous-scheme
`AdditionalValue` candidate therefore raises when `where(name: ...)` builds its
bind, not when the query runs.

trails#8248 ported that `initialize` body. In
`packages/activerecord/src/encryption/extended-deterministic-queries.trails.test.ts`
the YAML-coder model now raises `DisallowedClass` synchronously from `where`, as
Rails would. The JSON-coder twin
(`raises NoMethodError when a previous-scheme candidate reaches the serialized coder`)
still raises only from `where(...).first()`. Its failing `JSON.dump`
(`coders/json.ts:5` ← `type/serialized.ts:38`) is reached after an `await` in the
execution path, not from `PredicateBuilder#buildBindAttribute` at `where` time.

## Acceptance criteria

- Find the path that serializes the JSON-coder candidate after the `where` call returns, and make it build its `QueryAttribute` (and so its eager `value_for_database`) at `where` time, as Rails does.
- The JSON twin asserts a synchronous raise from `where`, like the YAML twin.
