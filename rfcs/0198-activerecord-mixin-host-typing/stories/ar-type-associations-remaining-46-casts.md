---
title: "ar-type-associations-remaining-46-casts"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9122
claim: "2026-10-20T13:10:58Z"
assignee: "ar-type-associations-remaining-46-casts"
blocked-by: null
closed-reason: null
---

## Context

trails#9116 brought the non-test `as any|as unknown` count in `packages/activerecord/src/associations/**` to 46. Removing the following produced type errors and needs the underlying types fixed first:

- `collection-association.ts:215` `klass.transaction(block)` — block typed `() => R | Promise<R>` vs `(tx) => Promise<R>`.
- `has-many-through-association.ts:200` `throughAssociation().scope()` (returns `unknown`); `:225` `decrementCounter` gets `string | null` counter column.
- `join-dependency.ts:233`, `preloader/branch.ts:254` — `AbstractReflection` lacks `name` / `options`.
- `has-one-association.ts:49,233` — `this.target` constructor typed `Function`; `Base` has no index signature.

## Acceptance criteria

- [ ] Each cast above is dropped by typing its receiver, with no runtime change.
- [ ] `associations/**` count drops below 46.
