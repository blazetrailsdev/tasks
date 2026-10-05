---
title: "ruby-compat: one Module#=== that honours Symbol.hasInstance, primitives and Object"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Module#===` (`vendor/ruby/v3.3.11/object.c:889` `rb_obj_is_kind_of`) has no single ruby-compat spelling that is right for every receiver, so
`ActiveRecord::Coders::ColumnSerializer#assert_valid_value`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/coders/column_serializer.rb:45-50`,
`unless object.nil? || object_class === object`) is ported in
`packages/activerecord/src/coders/column-serializer.ts:62-70` as

```ts
object == null || this._objectClass === Object || Object(object) instanceof this._objectClass;
```

One Ruby clause is two JS clauses. Each alternative fails a real case (found on trails PR 8542):

- `rbObjIsKindOf(object, klass)` (`packages/ruby-compat/src/include.ts:926`) walks the prototype chain and does not consult
  `Symbol.hasInstance`, which CLAUDE.md § "Ruby protocol methods with a different JS mechanism" names as the port of an
  overridden `is_a?`. It reds 24 tests in `serialized-attribute.test.ts`, whose `HashObject` double defines `Symbol.hasInstance`.
- bare `object instanceof klass` is false for a primitive: `String === "x"` holds in Ruby.
- `Object(object) instanceof klass` is false for a null-prototype object against `Object` (a YAML-loaded mapping); it reds
  `yaml-serialization.test.ts` "roundtrip serialized column" on all three adapters.

## Acceptance criteria

- [ ] ruby-compat has one `Module#===` / `kind_of?` entry point that honours `Symbol.hasInstance`, answers true for a primitive of the class (`String === "x"`, `Integer === 1`) and answers true for every value against `Object`, including a null-prototype object. Either `rbObjIsKindOf` gains those arms or a sibling is added with its MRI citation and receipt.
- [ ] `ColumnSerializer#assertValidValue` is `object == null || <that call>(object, this._objectClass)`, one clause, with no `=== Object` test.
- [ ] `column-serializer.trails.test.ts`, `serialized-attribute.test.ts` and `yaml-serialization.test.ts` stay green.
