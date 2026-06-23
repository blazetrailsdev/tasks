---
title: "Materialize declare accessors for PR #3672's bulk-converted in-class associations"
status: ready
updated: 2026-06-23
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3672 ran the `blazetrails/no-standalone-associations` autofixer across the
whole grandfathered population, converting standalone
`Associations.<macro>.call(Model, …)` into the in-class `this.<macro>(…)` form
in 30 source files and pruning the baseline
(`eslint/no-standalone-associations-exclude.json`) from 1846 → 352 entries.

That PR converted the _call form only_. As the rule docstring states
(`eslint/no-standalone-associations.mjs`: "This rule only converts the call
form — it does NOT add `declare` accessors. After converting, run the declare
generator to materialize them."), the declare generator was intentionally left
out of scope. So the newly in-class associations across the 29 files other than
`associations.test.ts` (which is covered by the sibling story
`convert-associations-test`) do not yet have their `declare <assoc>: …`
accessors materialized — `parent.children` reads are untyped at those sites.
This is an ergonomics/typing follow-up, not a runtime correctness gap (the full
suite is green without it).

Converted files (excluding associations.test.ts) include:
`adapters/postgresql/schema-ar-models.ts`, the `associations/*.test.ts` group
(belongs-to, has-many, has-many-through, has-one-through, nested-through-_,
eager_, extension, inner-join, constructor-form-and-hmt-insert,
association-scope, eager-load-nested-include, eager-singularization), plus
`autosave-association.test.ts`, `autosave.test.ts`, `calculations.test.ts`,
`counter-cache.test.ts`, `habtm-destroy-order.test.ts`,
`nested-attributes.test.ts`, `reflection.test.ts`, `relation/*.test.ts`
(delete-all, where, where-chain), `relations.test.ts`, `statement-cache.test.ts`,
`strict-loading.test.ts`, `test-fixtures.ts`, `timestamp.test.ts`,
`transaction-callbacks.test.ts`, `validations/association-validation.test.ts`.

## Acceptance criteria

- Run `packages/activerecord/scripts/materialize-model-declares.ts` over the
  in-class associations introduced by PR #3672 (the 29 converted files other
  than associations.test.ts) to materialize the `declare <assoc>: …` accessors.
- Where the generator cannot handle an inline test-local model class, note the
  gap (cross-reference RFC 0019's `materialize-declares-*` stories) rather than
  hand-writing accessors.
- No behavior change; typecheck stays green.
