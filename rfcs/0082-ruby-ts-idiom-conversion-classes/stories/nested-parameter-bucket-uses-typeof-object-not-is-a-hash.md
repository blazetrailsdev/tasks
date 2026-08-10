---
title: "_assignAttributes buckets any object as a Hash instead of is_a?(Hash)"
status: draft
updated: 2026-08-03
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`_assignAttributes` in `packages/activerecord/src/attribute-assignment.ts:50`
buckets a value into `nestedParameterAttributes` with:

```ts
} else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
```

Rails' `_assign_attributes`
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:13`)
tests `v.is_a?(Hash)`. In JS a `Date`, a `Temporal.*`, a `Buffer`, or an
ActiveRecord model instance is all `typeof "object"` and not an `Array`, so
every one of them is wrongly treated as a nested parameter hash and deferred to
`assign_nested_parameter_attributes` (:26-28) instead of being assigned in the
scalar pass. Ordering is observable — see PR #6003, which fixed exactly this
class of bug in the sibling copy of the method.

PR #6003 introduced `isNestedParameterHash` in
`packages/activerecord/src/persistence.ts` as the faithful `is_a?(Hash)`
analogue (plain-object prototype check). The `attribute-assignment.ts` copy was
out of that PR's scope and still carries the loose test.

## Converged shape

Use the same plain-object predicate as `persistence.ts#isNestedParameterHash`
in `attribute-assignment.ts#_assignAttributes`, so a Date/Temporal/model value
takes the `_assignAttribute` scalar arm (:17).

## Acceptance criteria

- [ ] `_assignAttributes` defers only plain hashes, matching `v.is_a?(Hash)`.
- [ ] A regression test that fails on baseline: an attribute bag mixing a
      `Temporal`/`Date`-valued column key with a scalar key, asserting the
      temporal key is assigned in the scalar pass.
- [ ] One predicate shared by both call sites rather than two spellings.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
