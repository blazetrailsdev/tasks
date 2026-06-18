---
title: "assoc-associations-test-wave7-convert-canonical"
status: done
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3573
claim: "2026-06-18T00:41:32Z"
assignee: "assoc-associations-test-wave7-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave6-convert-canonical` (RFC 0019). Wave 6
converted the Sharded belongs*to / has_many composite-FK assign/nullify cluster
(append-autosave, nullify/assign composite FK has_many + belongs_to,
assign/append with autosave, belongs_to-does-not-use-parent-query-constraints,
polymorphic-belongs_to-uses-parent-query-constraints) onto canonical
`Sharded::*`models + fixtures, moving them into the canonical (second)`AssociationsTest`describe and removing scratch tables`pbt*\_`, `cpk*owner2s`,
`cpk\*item2s`, `cpk_childs`, `cpk_parent2s/3s`, `cpk_child2s/3s`, `as_cpk\**`,
`bt*nqc\*\*`. Wave 6 also fixed a real impl gap surfaced by the conversion:
`BelongsToAssociation#foreignKeyNames`/`associationPrimaryKeys`now derive the
composite FK from the owner's`query_constraints`(Rails`derive_fk_query_constraints`/`association_primary_key`) instead of the scalar
target PK, so a belongs_to writer on a query_constraints owner sets/nullifies
ALL composite FK columns (e.g. `[blog_id, blog_post_id]`).

The remaining bespoke bodies in the FIRST `AssociationsTest` describe still ride
inline `defineSchema` scratch tables and must be converted onto canonical CPK /
Sharded models (`test-helpers/models/cpk/*`, `.../sharded/*`) + fixtures (or
registered as deviations if no Rails counterpart exists). Remaining test names:

- `loading cpk association when persisted and in memory differ` (Cpk::Order/Book)
- `should construct new finder sql after create` (Person/Reader/Post)
- `force reload` (Firm/Client)
- `belongs to a cpk model by id attribute` (Cpk::Order/OrderAgreement)
- `has many loads via inline fallback resolving composite owner key from query constraints` (trails-specific — no Rails test; decide convergence)
- `has one loads via inline fallback resolving composite owner key from query constraints` (trails-specific)
- `setBelongsTo infers composite foreign key from target primary key` (trails-specific)
- `setBelongsTo nullifies inferred composite foreign key` (trails-specific)
- `query constraints that dont include the primary key raise with a single column` (Sharded::BlogPost; global query_constraints mutation w/ ensure-restore)
- `query constraints that dont include the primary key raise with multiple columns`
- `assign belongs to cpk model by id attribute` (Cpk::OrderAgreement)
- `append composite has many through association` (Sharded::Tag/BlogPostTag)
- `append composite has many through association with autosave`
- `nullify composite has many through association`
- `delete single composite has many through join row` (trails-specific)
- `composite has many through raises ConfigurationError when target model has composite primary key` (trails-specific)
- `polymorphic-through with composite owner primary key requires explicit single-column primaryKey` (trails-specific)
- `belongs to with explicit composite foreign key` (Cpk::Car/CarReview) — already
  present canonical? verify duplicate before porting
- `cpk model has many records by id attribute` (Cpk::Order/OrderAgreement)

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Port each remaining first-`AssociationsTest`-describe body word-for-word
      from `associations_test.rb` onto canonical CPK / Sharded models + fixtures;
      test names unchanged. Move converted bodies into the canonical (second)
      `AssociationsTest` describe. For trails-specific bodies with no Rails
      counterpart, decide convergence per the deviation policy rather than
      ratifying.
- [ ] Remove each scratch table from the inline `defineSchema` as its last
      consumer is converted.
- [ ] Split into non-overlapping <=500 LOC sibling PRs off main (NOT stacked) if
      it does not fit in one; register further waves rather than fanning out.
- [ ] FINAL wave only: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json`; `test:compare` delta
      non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.

Hard rules: NO node:_/process._ ; async fs only ; no new runtime deps ; 500 LOC
ceiling ; NO stacked PRs ; test names match Rails verbatim ; camelCase only ;
draft PR + /link.
