---
title: "Run reflection.check_validity! in Association#initialize for all macros (Rails parity)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-19T15:12:29Z"
assignee: "check-validity-in-association-initialize"
blocked-by: null
---

## Context

Surfaced in PR #3503. Rails runs `reflection.check_validity!` in
`Association#initialize` (association.rb), so EVERY association misconfiguration
(missing inverse, recursive inverse, composite-PK/FK length mismatch,
through/source errors) surfaces on first association access regardless of macro.

trails defers this: PR #3503 added only the **recursion** verdict
(`checkValidityOfInverseBang`) to the `loadBelongsTo` load path
(`packages/activerecord/src/associations.ts:956`), scoped to re-throw only
`InverseOfAssociationRecursiveError` and swallow `InverseOfAssociationNotFound`
(so the "Did you mean?" corrections from `validateInverseOf` still win). Through
reflections already run `checkValidityBang` via `validateThroughReflection` in
the `Association` constructor (`associations/association.ts:63`), but the general
`check_validity!` (inverse + composite-PK checks for belongs_to/has_many/has_one)
is NOT called on construction.

Converging to Rails means calling the full `reflection.check_validity!` in the
`Association` constructor for all macros. The blocker found in #3503: doing so
eagerly (a) raises during inverse-seeded `build` (before any load), and
(b) the bare `checkValidityOfInverseBang` NotFound error lacks the "Did you
mean?" corrections that `validateInverseOf` computes from the load-time
`inverseOf` option — so naive convergence regresses the
`trying to use inverses that dont exist should have suggestions for fix` test.
Convergence must reconcile error-message construction (thread corrections into
`InverseOfAssociationNotFoundError` from the reflection path) and the
build-vs-load timing.

## Acceptance criteria

- [ ] `reflection.check_validity!` runs in `Association#initialize` for all
      macros, matching Rails (not just through-reflections).
- [ ] Missing-inverse errors keep their "Did you mean?" corrections.
- [ ] Inverse-seeded `build` does not spuriously raise before a load.
- [ ] Remove the load-path recursion-only shim in `loadBelongsTo` once the
      constructor path covers it.
