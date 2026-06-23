---
title: "Materialize declares for in-describe/it nested test models skipped by the top-level-only walker"
status: claimed
updated: 2026-06-23
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 5
pr: null
claim: "2026-06-23T21:30:42Z"
assignee: "materialize-declares-nested-class-models"
blocked-by: null
---

## Context

`materialize-declares-bulk-conversion` (PR #4016) ran
`packages/activerecord/scripts/materialize-model-declares.ts` over the 29
files PR #3672's autofixer converted from standalone
`Associations.<macro>.call(Model, …)` to in-class `this.<macro>(…)`. Only
**4** files materialized (`relation/delete-all.test.ts`,
`associations/eager.test.ts`, `associations/eager-load-nested-include.test.ts`,
`relations.test.ts`) — the ones with top-level `Base`-extending model classes.

The remaining **25** converted files declare their model classes **inline
inside `describe`/`it` callbacks**. The generator's syntactic walker
(`src/type-virtualization/walker.ts`, `walk()`) only iterates
`sourceFile.statements`, so it never visits classes nested in function bodies
and silently leaves those files unchanged. Those associations therefore still
have no materialized `declare <assoc>: …` accessors.

Skipped (unchanged) files include: `adapters/postgresql/schema-ar-models.ts`,
`associations/association-scope.test.ts`,
`associations/belongs-to-associations.test.ts`,
`associations/constructor-form-and-hmt-insert.test.ts`,
`associations/eager-singularization.test.ts`,
`associations/extension.test.ts`,
`associations/has-many-associations.test.ts`,
`associations/has-many-through-associations.test.ts`,
`associations/has-one-through-associations.test.ts`,
`associations/inner-join-association.test.ts`,
`associations/nested-through-associations.test.ts`,
`autosave-association.test.ts`, `calculations.test.ts`,
`counter-cache.test.ts`, `habtm-destroy-order.test.ts`,
`nested-attributes.test.ts`, `reflection.test.ts`,
`relation/where-chain.test.ts`, `relation/where.test.ts`,
`statement-cache.test.ts`, `strict-loading.test.ts`, `test-fixtures.ts`,
`timestamp.test.ts`, `transaction-callbacks.test.ts`,
`validations/association-validation.test.ts`.

## Acceptance criteria

- [ ] Extend `walk()` (and `virtualize`/`computeBaseNames` as needed) to visit
      model classes declared inside `describe`/`it`/function bodies, splicing
      `declare` members into them — not just top-level statements.
- [ ] Re-run the generator over the 25 skipped files and bake the resulting
      `declare <assoc>: …` accessors into source.
- [ ] Reuse the out-of-`MODELS_DIR` no-schema-merge path from PR #4016 so
      bespoke test-local models get no phantom canonical columns.
- [ ] No behavior change; typecheck and the affected suites stay green.
- [ ] Split into multiple PRs if the bake-in exceeds the 500-LOC ceiling
      (file new stories rather than fanning out).
