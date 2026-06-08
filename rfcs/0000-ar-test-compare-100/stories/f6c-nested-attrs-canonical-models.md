---
title: "F-6c — migrate nested-attributes.test.ts to canonical Human/Interest models"
status: ready
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: ["f6b-repair-validations-helper"]
deps-rfc: []
est-loc: 300
blocked-by: null
---

## Context

`nested-attributes.test.ts` uses file-private `n_human4s`/`n_interest4s`
tables with per-test local classes (`NHuman*`, `NInterest*`, `NCW*`, `NVP*`,
etc.) instead of the canonical `Human`/`Interest` models that Rails tests use.
The original reason was isolation: `acceptsNestedAttributesFor` mutated class
state (accumulated `_nestedAttributeConfigs`, leaked validators). Both gaps are
now fixed:

- `_nestedAttributeConfigs` upserts instead of pushes (PR #3011) — re-calling
  `acceptsNestedAttributesFor` on a canonical model with new options now
  correctly replaces the old config.
- `repairValidations` helper (F-6b) — test-scoped validators no longer leak.

With those in place, the test file can use `Human.hasMany("interests", …)`
(already declared in `test-helpers/models/human.ts`) and `Interest` directly,
matching Rails `nested_attributes_test.rb` exactly.

## Acceptance criteria

- [ ] `nested-attributes.test.ts` imports and uses canonical `Human`,
      `Interest` from `test-helpers/models/` instead of per-test local classes.
- [ ] The `n_human4s`/`n_interest4s` table definitions are removed from
      `TEST_SCHEMA` (or `TEST_SCHEMA` itself is removed if unused).
- [ ] `test:compare` for `nested_attributes_test.rb` is non-negative vs current.
- [ ] All 119 currently-passing tests still pass.

## Notes

The canonical `Interest` model (`test-helpers/models/interest.ts`) does not
currently declare `belongsTo("human", { inverseOf: "interests" })` with a
`human_id` FK — verify the schema includes `human_id` and that the inverse is
wired before starting. The `interests` fixture data
(`test-helpers/fixtures/interests.ts`) already has `human_id` rows.
