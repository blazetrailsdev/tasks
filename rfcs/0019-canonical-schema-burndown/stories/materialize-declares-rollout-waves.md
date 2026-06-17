---
title: "Materialize model declares: roll the generator across test-helpers/models in waves"
status: claimed
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["materialize-declares-generator-fixes"]
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: "2026-06-17T14:31:50Z"
assignee: "materialize-declares-rollout-waves"
blocked-by: null
---

## Context

With the virtualizer gaps fixed (dep), roll
`materialize-model-declares.ts` across the full
`packages/activerecord/src/test-helpers/models/` directory in reviewable waves,
baking typed `declare` members into each model's source.

Each wave: run the generator on a batch of models, verify they typecheck green,
commit. Keep each PR ≤500 LOC (the generated declares count as LOC).

## Acceptance criteria

- [ ] Run the generator over `test-helpers/models/` in batches; each batch
      typechecks green with no hand-edits.
- [ ] Models that still hit an unresolved-target/loader/`_tableName` gap are
      reported (not force-written with broken declares) and registered as a
      follow-up generator-fix story — do not paper over with `as any`.
- [ ] `pnpm tsc` (or the AR typecheck task) passes after each wave.
- [ ] Each wave is its own PR off `main`, ≤500 LOC, non-overlapping files
      (NOT stacked).

## Notes

- Do NOT fan out all waves as sibling PRs yourself; ship one wave, register the
  next as a new story.

## Definition of done

The materializable models under `test-helpers/models/` carry baked typed
declares. Remaining gaps are registered, not hidden. Unblocks
`materialize-declares-strip-asany`.
