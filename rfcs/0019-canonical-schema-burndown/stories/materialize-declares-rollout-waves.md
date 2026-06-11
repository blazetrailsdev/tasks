---
title: "Materialize model declares: roll the generator across test-helpers/models in waves"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["materialize-declares-generator-fixes"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to the declare-materialization pilot (trails PR #3099). With the
virtualizer/walker gaps closed (`materialize-declares-generator-fixes`), the
generator can run cleanly across the rest of the canonical model graph. The
pilot established that the `as any` payoff only materializes once the **whole**
graph is materialized — integration tests reach unmaterialized models
(`developer.projects[0].name` → `Project` untyped), so partial coverage keeps
the casts. This story materializes the remainder of `test-helpers/models/**`.

## Acceptance criteria

- [ ] Run `materialize-model-declares.ts` across the rest of
      `test-helpers/models/**`, sequenced in waves of ≤500 LOC each (the
      claimable per-PR unit).
- [ ] Each wave reports the `as any` delta it produces (counts before/after over
      the AR test suite).
- [ ] `pnpm typecheck` is green after each wave; no wave is merged red.
- [ ] Continuation waves that exceed the per-PR ceiling are registered as new
      stories via `pnpm tasks new canonical-schema-burndown <slug>` rather than
      stacked.

## Notes

Measure the `as any` drop after each wave, not per single model — the pilot
showed single-model materialization drops ~0 casts. The cumulative graph
coverage is what unlocks the strip work in
`materialize-declares-strip-asany`.
