---
title: "json-coder-previous-scheme-candidate-serialized-lazily-past-where"
status: draft
updated: 2026-09-29
rfc: "0156-parity-beyond-name-presence"
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
