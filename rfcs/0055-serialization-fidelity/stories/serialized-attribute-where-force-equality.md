---
title: "Serialized-attribute WHERE: force_equality? must match plain object/array (un-skip 3 tests)"
status: done
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 26
pr: 4731
claim: "2026-07-07T21:05:24Z"
assignee: "serialized-attribute-where-force-equality"
blocked-by: null
closed-reason: null
---

## Context

`predicate-builder-force-equality-uniform-build` (PR #4614) lifted
`force_equality?` to uniform dispatch at the top of `PredicateBuilder#build`,
so a Serialized-type force-equality value now routes to a single equality bind.
But three tests stay `it.skip` in
`packages/activerecord/src/serialized-attribute.test.ts:305-315`:

- `where by serialized attribute with array`
- `where by serialized attribute with hash`
- `where by serialized attribute with hash in array`

Rails (`serialized_attribute_test.rb:230-248`) does e.g.
`Topic.serialize(:content, type: Array); Topic.where(content: settings).take`.
Rails' `Type::Serialized#force_equality?` is `value.is_a?(coder.object_class)`
where `object_class` is the builtin `Array`/`Hash` — so a plain `['x']` / `{k:1}`
matches and force-equalizes.

trails' `Type::Serialized#isForceEquality`
(`packages/activerecord/src/type/serialized.ts:153`) is
`value instanceof coder.objectClass`, and the serialize tests use the
`HashObject` wrapper class as `object_class`. A plain JS object/array is NOT
`instanceof HashObject`, so `force_equality?` never fires for a bare value and
the WHERE bind isn't emitted. End-to-end serialized WHERE therefore still needs
the object-class matching to accept plain `{}` / `[]` the way Rails' builtin
`Hash`/`Array` do.

## Acceptance criteria

- [ ] `Type::Serialized#isForceEquality` (or the coder's `objectClass` semantics)
      matches a plain JS object for a `Hash`-typed coder and a plain array for an
      `Array`-typed coder, mirroring Rails `value.is_a?(coder.object_class)`.
- [ ] Un-skip and pass `where by serialized attribute with array`,
      `where by serialized attribute with hash`, and
      `where by serialized attribute with hash in array` in
      `serialized-attribute.test.ts`, mirroring `serialized_attribute_test.rb`
      (`Topic.serialize(:content, type: Array/Hash)` then
      `Topic.where(content: settings).take`).
- [ ] No regression to `predicate-builder.test.ts` or PG `array.test.ts` /
      `range.test.ts` force-equality behavior; `test:compare` non-negative.
