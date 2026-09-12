---
title: "Drop JoinPart#isReadonly / #isStrictLoading; Rails declares both only on JoinAssociation"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/join-dependency/join-part.ts:35-41`
declares `isReadonly()` and `isStrictLoading()`, both returning `false`.
Rails' `JoinPart` has neither — they are defined only on `JoinAssociation`
(`activerecord/lib/active_record/associations/join_dependency/join_association.rb:79`
and `:85`), which trails already overrides at
`join-dependency/join-association.ts:148,154`.

The base stubs exist because `JoinDependency#constructModel` used to take a
`node: JoinPart` and call `node.isReadonly()` / `node.isStrictLoading()` at
`join-dependency.ts:600-601`. PR #7725 narrowed `constructModel` and the four
`_wire*` / `_mark*` helpers to `node: JoinAssociation`, so those two call sites
now hold a `JoinAssociation` statically and the base declarations look dead.

A grep of `isReadonly()` / `isStrictLoading()` across `packages/activerecord/src`
finds no other `JoinPart`-typed receiver: every remaining caller is on a model
instance (`persistence.ts`, `timestamp.ts`, `touch-later.ts`,
`associations/association.ts`) or on a `Relation`, all unrelated surfaces that
happen to share the name.

PR #7725 closed
[[converge-join-part-onto-rails-join-part-surface]] by removing the six tagged
fields plus `tableAlias`, taking `JoinPart` to Rails' declared surface. These
two methods are the last members on the class that Rails' `JoinPart` does not
declare, and they were out of that PR's scope because the retyping that made
them dead landed in the same PR.

## Converged shape

Delete `isReadonly()` and `isStrictLoading()` from `join-part.ts`, leaving
`JoinPart` as exactly `join_part.rb:12-67` — `baseKlass`, `children`, the four
delegations, `isMatch`, `each`, `eachChildren`, `table`, `extractRecord`,
`instantiate`, plus `drop` and the JS iterator that serve the
`include Enumerable` at `join_part.rb:13`. The `override` keyword comes off the
two `JoinAssociation` definitions, which then stand alone exactly as
`join_association.rb:79,85` do.

## Acceptance criteria

- `join-part.ts` declares no `isReadonly` / `isStrictLoading`.
- `join-association.ts:148,154` keep both methods, without `override`.
- `pnpm typecheck` is clean — if a `JoinPart`-typed receiver turns up, narrow
  that call site rather than restoring the base declaration.
- `pnpm parity:api:extra:gate` stays green and
  `pnpm parity:api:extra:tighten` is run if activerecord's total drops.
- The associations and eager-loading suites stay green on all three lanes.
