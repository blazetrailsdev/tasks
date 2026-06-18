---
title: "assoc-associations-test-wave6-convert-canonical"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3572
claim: "2026-06-17T23:47:00Z"
assignee: "assoc-associations-test-wave6-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave5-convert-canonical` (RFC 0019). Wave 5
converted the read/query Sharded composite-key batch of the first
`AssociationsTest` describe in
`packages/activerecord/src/associations.test.ts` onto canonical
`Sharded::BlogPost` / `Sharded::Comment` / `Sharded::BlogPostWithRevision`
models + sharded fixtures, moving them into the canonical (second)
`AssociationsTest` describe and removing the scratch tables `qwar_*`, `qsar_*`,
`qrk_authors`, `dqc_*`, `cqc_*`, `pmqc_*`, `qc_three_*`.

The remaining bespoke bodies in the FIRST `AssociationsTest` describe still ride
the inline `defineSchema` scratch tables (`cpk_*`, `as_cpk_*`, `cfk_*`,
`cpk_thru_*`, `inf_*`, `pbt_*`, `nrfqc_*`, `b_*`, `c_*`, `qc_single_*`,
`qc_multi_*`, etc.) and must be converted onto canonical CPK / Sharded models
(`test-helpers/models/cpk/*`, `.../sharded/*`) + fixtures (or registered as
deviations if no Rails counterpart exists). Remaining test names (first
describe):

- `loading cpk association when persisted and in memory differ` (Cpk::Order/Book)
- `should construct new finder sql after create` (Person/Reader/Post)
- `force reload` (Firm/Client)
- `belongs to a cpk model by id attribute` (Cpk::Order/OrderAgreement)
- `has many loads via inline fallback resolving composite owner key from query constraints` (trails-specific -- no Rails test; decide convergence/keep)
- `has one loads via inline fallback resolving composite owner key from query constraints` (trails-specific)
- `belongs to association does not use parent query constraints if not configured to` (Sharded blogPostById)
- `polymorphic belongs to uses parent query constraints` (Sharded::BlogPost polymorphic parent)
- `nullify composite foreign key has many association`
- `assign persisted composite foreign key belongs to association`
- `nullify composite foreign key belongs to association`
- `assign composite foreign key belongs to association`
- `setBelongsTo infers composite foreign key from target primary key`
- `setBelongsTo nullifies inferred composite foreign key`
- `query constraints that dont include the primary key raise with a single column`
- `query constraints that dont include the primary key raise with multiple columns`
- `assign belongs to cpk model by id attribute` (Cpk::Target/Ref)
- `append composite foreign key has many association with autosave`
- `assign composite foreign key belongs to association with autosave`
- `append composite has many through association`
- `append composite has many through association with autosave`
- `nullify composite has many through association`
- `delete single composite has many through join row`
- `composite has many through raises ConfigurationError when target model has composite primary key`
- `polymorphic-through with composite owner primary key requires explicit single-column primaryKey`
- `belongs to with explicit composite foreign key` (Cpk::Car/CarReview)
- `cpk model has many records by id attribute` (Cpk::Order/OrderAgreement)

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Port each remaining first-`AssociationsTest`-describe body word-for-word
      from `associations_test.rb` onto canonical CPK / Sharded models + fixtures;
      test names unchanged. Move converted bodies into the canonical (second)
      `AssociationsTest` describe. For trails-specific bodies with no Rails
      counterpart (the two "inline fallback" tests), decide convergence per the
      deviation policy rather than ratifying.
- [ ] Remove each scratch table from the inline `defineSchema` as its last
      consumer is converted.
- [ ] Split into non-overlapping <=500 LOC sibling PRs off main (NOT stacked) if
      it does not fit in one; register further waves rather than fanning out.
- [ ] FINAL wave only: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json`; `test:compare` delta
      non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
