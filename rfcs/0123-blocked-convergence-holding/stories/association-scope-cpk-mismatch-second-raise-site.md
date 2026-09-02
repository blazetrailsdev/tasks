---
title: "AssociationScope raises CompositePrimaryKeyMismatchError at two sites Rails does not have"
status: draft
updated: 2026-09-02
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `AssociationScope` raises `CompositePrimaryKeyMismatchError` at two sites Rails does not have

## Context

Rails raises `CompositePrimaryKeyMismatchError` from exactly one place —
`AssociationReflection#check_validity!`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:618-628`), which
`Association#initialize` calls (`associations/association.rb:42`).
`AssociationScope` never raises it: `add_constraints`
(`associations/association_scope.rb:110`) assumes the reflection is already
valid, and `last_chain_scope` / `next_chain_scope`
(`association_scope.rb:60-100`) contain no length comparison at all.

trails has a second and third raise site. `lastChainScope`
(`packages/activerecord/src/associations/association-scope.ts:239-252`) and
`nextChainScope` (`:313-326`) each compare
`joinPrimaryKey().length !== joinForeignKey.length` and, on a mismatch, look the
reflection up by name off the owner class to call `checkValidityBang()` before
throwing a locally-constructed `CompositePrimaryKeyMismatchError` themselves.

PR #7372 removed the trails-only `routeThroughCheckValidity` wrapper that sat in
front of those two throws and spelled the Rails call directly, but did not
remove the throws — the guard is load-bearing for
`associations/association-scope.trails.test.ts`'s
"addConstraints routes a composite-PK mismatch through checkValidityBang",
which constructs no `Association` and so never reaches Rails' single raise site.
Note the local throw's message swaps the pk/fk operands relative to Rails'
(`primaryKey: joinPks, foreignKey: joinFks` where Rails reports
`active_record_primary_key` against `foreign_key`), which is why the check-validity
call in front of it is what actually produces the Rails-shaped message today.

This is the `AssociationScope` twin of `has-one-as-composite-guard-second-raise-site`
(done, PR #6438), which converged the same shape out of `_findHasOneTarget`.

## Converged shape

Delete both length comparisons and both local `throw new
CompositePrimaryKeyMismatchError(...)` sites, leaving `check_validity!` on
`Association#initialize` as the single raise site, as Rails has it. Rewrite the
trails-only test to construct the association (or assert the raise off
`reflection.checkValidityBang()`) rather than off a bare `AssociationScope.scope`
call.

## Acceptance criteria

- [ ] `association-scope.ts` contains no `CompositePrimaryKeyMismatchError`
      construction and no `joinPks.length !== joinFks.length` guard.
- [ ] `CompositePrimaryKeyMismatchError` is raised only from
      `checkValidityBang()` (`reflection.ts:924`).
- [ ] `associations/association-scope.trails.test.ts` and
      `composite-primary-key.test.ts` stay green on all three adapter lanes.
- [ ] `pnpm parity:api:extra --package activerecord` non-negative.
