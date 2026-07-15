---
title: "predications.ts in/notIn match Enumerable via iterable, not Array.isArray"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/predications.ts:145-176` is the second implementation of
`in` / `notIn` (the `Predications` mixin; `Attribute` has its own at
`packages/arel/src/attributes/attribute.ts:233-244`). It already has all three
Rails arms, but matches the Enumerable arm with `Array.isArray(other)`.

Ruby's `Enumerable` (predications.rb:65-74 for `in`, 112-121 for `not_in`)
spans Set, Hash and Range as well as Array. With an `Array.isArray` check, a
`Set` / `Map` / generator falls past the guard into the scalar `else` arm and
silently becomes `Casted(theContainer, attribute)` — a wrong AST rather than a
loud failure.

PR #4886 fixed exactly this on `Attribute` by matching any JS iterable:

```ts
function isEnumerable(value: unknown): value is Iterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.iterator in value;
}
```

Strings are iterable in JS but Ruby's `String` is NOT Enumerable, so
`typeof value === "object"` correctly excludes them; a plain object is not
iterable and correctly reaches `quoted_node` (matching `Object.new` at
attribute_test.rb:747-757). `predications.ts` should use the same guard.

Secondary: the arm ORDER also differs from Rails. `predications.ts` checks
Array first, then SelectManager, then else; Rails is SelectManager →
Enumerable → else. No behavioural difference today (a SelectManager is not an
array), but it reads against the source.

## Acceptance criteria

- [ ] `predications.ts` `in` / `notIn` match the Enumerable arm on any JS
      iterable, not just `Array.isArray`, mirroring `Attribute`'s
      `isEnumerable` guard (attribute.ts, added by #4886).
- [ ] A Set / Map / generator expands through the Enumerable arm rather than
      being cast whole; a string and a plain object still reach `quoted_node`.
- [ ] Arm order matches Rails: SelectManager → Enumerable → else.
- [ ] Consider sharing the guard with `attribute.ts` rather than duplicating.
- [ ] api:compare / test:compare delta non-negative.
