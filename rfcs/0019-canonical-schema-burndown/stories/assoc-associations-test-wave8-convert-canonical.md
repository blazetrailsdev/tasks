---
title: "assoc-associations-test-wave8-convert-canonical"
status: done
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3575
claim: "2026-06-18T01:48:54Z"
assignee: "assoc-associations-test-wave8-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave7-convert-canonical` (RFC 0019, see
PR #3573). Wave 7 converted the CPK by-id-attribute cluster (`belongs to a cpk
model by id attribute`, `assign belongs to cpk model by id attribute`, `cpk
model has many records by id attribute`, `belongs to with explicit composite
foreign key`) onto canonical `CpkOrder`/`CpkOrderAgreement`/`CpkCar`/`CpkCarReview`

- `cpkOrders` fixtures and removed scratch tables `cpk_books`, `cpk_chapters`,
  `cpk_targets`, `cpk_refs`, `cpk_parents`, `cpk_children`, `cfk_orders`,
  `cfk_line_items`.

Remaining bespoke bodies in the FIRST `AssociationsTest` describe of
`packages/activerecord/src/associations.test.ts` still ride inline `defineSchema`
scratch tables:

- `should construct new finder sql after create` (Rails: Person/Reader/Post; b_posts/b_comments scratch)
- `force reload` (Rails: Firm/Client; c_posts/c_comments scratch)
- `append composite has many through association` (Rails Sharded::Tag/BlogPostTag; cpk_thru_doc1s/appt1s/pat1s)
- `append composite has many through association with autosave` (cpk*thru*\*2)
- `nullify composite has many through association` (cpk*thru*\*3)
- `query constraints that dont include the primary key raise with a single column` (Sharded::BlogPost global query_constraints mutation w/ ensure-restore)
- `query constraints that dont include the primary key raise with multiple columns`
- trails-specific (decide convergence, do not ratify): `has many/has one loads via inline fallback resolving composite owner key from query constraints`, `setBelongsTo infers/nullifies inferred composite foreign key`, `delete single composite has many through join row`, `composite has many through raises ConfigurationError when target model has composite primary key`, `polymorphic-through with composite owner primary key requires explicit single-column primaryKey`

Also deferred: `loading cpk association when persisted and in memory differ`
(blocked on cpk-counter-cache-column-demodulize-convergence).

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Port each Rails-counterpart body word-for-word onto canonical models +
      fixtures; test names unchanged; move into the canonical describe; remove
      each scratch table as its last consumer is converted.
- [ ] For trails-specific bodies with no Rails counterpart, decide convergence
      per the deviation policy rather than ratifying.
- [ ] Split into non-overlapping <=500 LOC sibling PRs off main if needed.
- [ ] FINAL wave only: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json` once ALL describes in the
      file (incl. AssociationProxyTest/PreloaderTest defineSchemas) are canonical;
      test:compare delta non-negative.
