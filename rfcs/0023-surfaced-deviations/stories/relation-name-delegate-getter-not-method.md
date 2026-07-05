---
title: "Converge Relation#name delegate from method to Rails property reader"
status: ready
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
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

PR #4615 (story `relation-delegation-expose-slice-and-name`) exposed
`delegate :name, to: :model` (`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:106`)
on the trails `Relation` class. In Rails `relation.name` is a **property
reader** (no parens) returning the model class name string.

trails deliberately exposes it as a **method** — `name(): string`
(`packages/activerecord/src/relation.ts:~6620`) — NOT a `get name(): string`
getter. Reason (documented inline at `relation.ts:~7997`): a string-typed
`name` getter makes the structurally-typed `Relation<T>` satisfy the ubiquitous
`{ name: string }` object shape, which silently flips `Array#reduce` accumulator
inference — e.g.
`[{ name }, …].reduce((memo, param) => memo.where(param), Model.unscoped())`
resolves the `reduce(cb, initial: T): T` overload with `T = { name }` (since
`Relation` becomes assignable to the element type) instead of the generic
`reduce<U>(cb, initial: U): U` with `U = Relation`, breaking `relations.test.ts`
("find all with multiple should use and", `relations.test.ts:1001`).

This is a calling-convention deviation: Rails callers write `relation.name`,
trails callers must write `relation.name()`. Behavior (the returned string) is
identical.

## Acceptance criteria

- Expose `Relation#name` as a property reader (`relation.name`, no parens)
  matching Rails, WITHOUT regressing `Array#reduce` accumulator inference on
  arrays of `{ name }`-shaped objects (keep `relations.test.ts` green) and
  without widening the `Relation<T>` structural surface such that it satisfies
  `{ name: string }`.
- Explore typing strategies: a branded/nominal return type, a private-named
  backing member, or a declaration-merge trick that keeps `name` off the
  structural surface used for `{ name }` matching while still resolving at the
  call site.
- api:compare relation.rb stays at 100%; no arity regression on `name`.
- If no viable getter strategy exists under TS structural typing, close as
  track-pending-convergence with the evidence (never wontfix).
