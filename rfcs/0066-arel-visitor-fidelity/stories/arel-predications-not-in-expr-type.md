---
title: "arel-predications-not-in-expr-type"
status: claimed
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-21T01:35:16Z"
assignee: "arel-predications-not-in-expr-type"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/predications.ts:305-321` types the `in` / `not_in` family's
element as an array:

```ts
inAny(this: PredicationHost & { in(o: unknown[]): Node }, others: unknown[][]): Grouping
notInAny(this: PredicationHost & { notIn(o: unknown[]): Node }, others: unknown[][]): Grouping
```

Rails does not narrow this. `Arel::Predications#not_in(other)`
(`vendor/rails/activerecord/lib/arel/predications.rb:107`) accepts an Array, a
Range, a SelectManager, or a bare scalar, and `grouping_any` /
`grouping_all` (232, 239) just `send` each element straight through.

Rails' own tests rely on that: `attribute_test.rb:1008` and `:1023` call
`relation[:id].not_in_any([1, 2])` / `not_in_all([1, 2])` — passing bare
integers, not arrays of arrays. Porting those tests verbatim in PR #5014
required `[1, 2] as unknown as unknown[][]` at both call sites, which is the
only cast in that file.

## Acceptance criteria

- [ ] `in` / `notIn` / `inAny` / `inAll` / `notInAny` / `notInAll` accept the
      full expr surface Rails accepts (scalar, Array, Range, SelectManager),
      matching `predications.rb` rather than narrowing to `unknown[]`.
- [ ] The two `as unknown as unknown[][]` casts in
      `packages/arel/src/attributes/attribute.test.ts` (`#not_in_any` /
      `#not_in_all`, "should create a Grouping node") are deleted, with the
      Rails call shape `notInAny([1, 2])` kept verbatim.
- [ ] No test is renamed. api:compare and test:compare deltas non-negative.
