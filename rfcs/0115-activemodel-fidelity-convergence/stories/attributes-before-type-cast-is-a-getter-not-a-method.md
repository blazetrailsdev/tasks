---
title: "attributes_before_type_cast is a getter where Rails has a plain method"
status: done
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6852
claim: "2026-08-22T01:20:38Z"
assignee: "lint-red-on-main-unnecessary-type-assertion-pg-exec-query"
blocked-by: null
closed-reason: null
---

## Context

`before_type_cast.rb:82-84` and `:86-89` are two ordinary zero-arg methods:

```ruby
def attributes_before_type_cast
  @attributes.values_before_type_cast
end

def attributes_for_database
  @attributes.values_for_database
end
```

trails ports the first as an **accessor property** and the second as a
**method**, from the same Ruby file:

- `packages/activerecord/src/base.ts` installs `attributesBeforeTypeCast` with
  `Object.defineProperty(Base.prototype, …, { get() { … } })`, so callers write
  `record.attributesBeforeTypeCast` with no parentheses.
- the sibling is wired through `include(Base, { attributesForDatabase: … })`
  as a plain method, called as `record.attributesForDatabase()`.

Both delegate to `packages/activerecord/src/attribute-methods/before-type-cast.ts`.
PR #6846 moved the getter here from `activemodel/src/model.ts` and pinned the
descriptor kind with a test, deliberately preserving the existing shape rather
than changing every call site mid-move — so the inconsistency is now enshrined
on `Base.prototype`, not merely inherited.

CLAUDE.md's "Generated attribute readers are properties" ratifies the property
form for **generated** attribute readers, where a JS accessor is forced. It does
not cover a hand-written zero-arg method like this one, which has no such
constraint: `attributes_for_database` proves a method works fine.

## Converged shape

`attributesBeforeTypeCast` becomes a plain method wired through `include()`
alongside `attributesForDatabase`, matching before_type_cast.rb:82:

```ts
export function attributesBeforeTypeCast(this: BeforeTypeCastRecord): Record<string, unknown> {
  return this._attributes.valuesBeforeTypeCast();
}
```

## Acceptance criteria

- `attributesBeforeTypeCast` is a method on `Base.prototype`, not an accessor
  property; the `Object.defineProperty` block in `base.ts` is deleted.
- Every call site moves from `record.attributesBeforeTypeCast` to
  `record.attributesBeforeTypeCast()` (grep across all packages, tests included).
- The `keeps attributesBeforeTypeCast a getter rather than a data property`
  test in `packages/activerecord/src/attribute-methods.trails.test.ts` is
  retired with the getter, and the descriptor assertion in the sibling
  prototype-ownership test still passes.
- `pnpm parity:api` arity for `attributes_before_type_cast` is satisfied by a
  0-arg method rather than a getter.
