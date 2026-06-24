---
title: "Lift force_equality? to uniform build dispatch (PG array + serialized)"
status: draft
updated: 2026-06-24
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`force-equality-bind-convergence` (PR #4062) converged only the **Range**
force-equality case. Rails applies `force_equality?` **uniformly for every
value** at the top of `build`, before any handler dispatch
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:57-69`):

```ruby
def build(attribute, value, operator = nil)
  value = value.id if value.respond_to?(:id)
  if operator ||= table.type(attribute.name).force_equality?(value) && :eq
    bind = build_bind_attribute(attribute.name, value)
    attribute.public_send(operator, bind)
  else
    handler_for(value).call(attribute, value)
  end
end
```

`force_equality?` is overridden by **three** types in Rails — all three already
exist in trails with matching bodies:

- `OID::Range` → `value.is_a?(::Range)` (range.rb:56 ↔
  `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:140`)
- `OID::Array` → `value.is_a?(::Array)` (array.rb:75 ↔
  `packages/activerecord/src/connection-adapters/postgresql/oid/array.ts:214`)
- `Type::Serialized` → `value.is_a?(coder.object_class)` (serialized.rb:52 ↔
  `packages/activerecord/src/type/serialized.ts:153`)

But trails' `PredicateBuilder#build`
(`packages/activerecord/src/relation/predicate-builder.ts:300-335`) only
consults `isForceEquality` inside the `value instanceof Range` branch (via
`_buildRangeEqualityOrNull`, line 322-326). So:

- **PG array column**, `where(arrayCol: [1, 2])`: trails routes to
  `arrayHandler` → `arr IN (1, 2)`. Rails forces `=` → `arr = '{1,2}'`
  (a single force-equality bind through `OID::Array#serialize` →
  `encode_array`). **Divergence.**
- **Serialized force-equality** (`where(serializedCol: anObjectOfCoderClass)`):
  never fires the force-equality bind path. **Divergence.**

The bind type_cast layer is already in place from PR #4062: `_bindForPg`
(`postgresql-adapter.ts`) already routes `ArrayData` through `typeCast` →
`encode_array`, so the array force-equality bind value will serialize correctly
once `build` emits it. No new adapter work needed for the array case.

### Subtleties to honor

- **Check precedence.** Rails checks `force_equality?` _before_ `handler_for`
  dispatch — so a force-equality value never reaches a registered handler
  (ArrayHandler/RangeHandler). The lift must sit **above** the custom-handler
  check (predicate-builder.ts:319-322), not just replace the Range/Array
  branches, to match Rails order exactly.
- **Type-lookup source.** Keep the multi-source type resolution
  (`attribute.relation` / `_tableContext` / `this.table`) introduced for the
  Range case and reuse the SAME type object for both the `force_equality?`
  check and the `QueryAttribute` (Rails uses one `table.type(attribute.name)`
  for both — see the PR #4062 review fix at predicate-builder.ts:506-515).
- **Generalize, don't special-case.** Replace `_buildRangeEqualityOrNull` with
  a type-agnostic `_buildForceEqualityOrNull(attribute, value)` that runs the
  three-source lookup and, on `isForceEquality(value)`, returns
  `attribute.eq(new QueryAttribute(attribute.name, value, type))`. The Range
  branch and array branch both defer to it first, falling through to their
  handlers on null.

## Acceptance criteria

- [ ] `where(arrayCol: [1, 2])` on a PG array column emits a single `$N`
      force-equality bind (`arr = $1` with `$1` = `'{1,2}'` via `encode_array`),
      matching Rails — NOT `arr IN (1, 2)`.
- [ ] Serialized-type force-equality (`value instanceof coder.objectClass`)
      emits a force-equality bind, matching `Type::Serialized#force_equality?`.
- [ ] The `force_equality?` check is evaluated uniformly at the top of `build`,
      before custom-handler / range / array dispatch — mirroring Rails'
      `operator ||= force_equality? && :eq` precedence.
- [ ] Range force-equality (already converged in #4062) stays green; all
      `adapters/postgresql/range.test.ts` and `array.test.ts` behavioral tests
      pass; `test:compare` non-negative.
- [ ] Reuses the same type object for the check and the bind (no second
      `this.table.typeForAttribute` lookup); no bind-everything regression.

Hard rules: camelCase only; test names match Rails verbatim; NO node:_/process._;
500 LOC ceiling; single PR from main; draft.
