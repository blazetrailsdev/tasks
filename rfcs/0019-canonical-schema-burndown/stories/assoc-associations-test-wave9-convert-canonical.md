---
title: "assoc-associations-test-wave9-convert-canonical"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3576
claim: "2026-06-18T02:22:10Z"
assignee: "assoc-associations-test-wave9-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave8-convert-canonical` (RFC 0019, PR
TBD). Wave 8 converted the clean, currently-passing Rails-counterpart bodies in
the FIRST `AssociationsTest` describe of
`packages/activerecord/src/associations.test.ts` onto canonical sharded models +
fixtures and moved them into the canonical describe:

- `query constraints that dont include the primary key raise with a single column`
- `query constraints that dont include the primary key raise with multiple columns`
- `nullify composite has many through association`

It added `shardedTags` / `shardedBlogPostsTags` fixtures and the `ShardedTag` /
`ShardedBlogPostTag` canonical models to the canonical describe, and removed the
scratch tables `qc_single_blog_posts`, `qc_single_comments`,
`qc_multi_blog_posts`, `qc_multi_comments`, `cpk_thru_doc3s`, `cpk_thru_appt3s`,
`cpk_thru_pat3s`.

Wave 8 STOPPED on four Rails-counterpart bodies whose faithful canonical port
fails against real trails impl gaps (left bespoke in the first describe rather
than ratified). Each needs a convergence fix before its canonical port can land:

1. `append composite has many through association` and
   `append composite has many through association with autosave`
   (Rails `test_append_composite_has_many_through_association[_with_autosave]`,
   `Sharded::BlogPost.tags << tag`). The faithful port (`ShardedBlogPost.tags`
   through `blogPostTags`, source `tag`) creates NO join row — the pushed tag is
   absent after reload. Root cause: `_pushThrough` in
   `packages/activerecord/src/associations/collection-proxy.ts` (~line 1885)
   computes `sourceFk = sourceRefl?.foreignKey` and writes
   `{ [sourceFk]: record._readAttribute(targetPk) }`. `ShardedTag` declares
   composite `query_constraints [blog_id, id]`, so the join's `belongsTo :tag`
   resolves a COMPOSITE source foreign key; `sourceFk` is then an array and the
   single-column write puts the value under a stringified array key, leaving
   `tag_id` null (join never matches on read). Fix: handle a composite source FK
   in `_pushThrough` (pair each source-FK column with the target's
   query-constraint key, mirroring the composite-owner branch already present).

2. `force reload` (Rails `test_force_reload`, Firm/Client). `new Client(...)` +
   `client.save()` on the OFFICIAL canonical `Client`
   (`packages/activerecord/src/test-helpers/models/company.ts:316`,
   `this.validate(async function () { await this.firm; })`) throws
   `Error: Async callback on sync chain "validate" — before returned a Promise`
   from `packages/activesupport/src/callbacks.ts:800`. The official `Client`'s
   async `validate` callback runs on a strict-sync validation chain; no existing
   test saves the official `Client` directly, so this gap is latent. Fix the
   sync/async classification so a model with an async `validate` saves via the
   async path.

3. `should construct new finder sql after create` (Rails
   `test_should_construct_new_finder_sql_after_create`, Person/Reader/Post). The
   port persists `Reader` with `person_id` set, but
   `association(person, "readers").find(reader.id)` raises `RecordNotFound`.
   `Reader.create({ person, post })` does not populate `person.readers`'
   in-memory target via inverse (Rails relies on `inverse_of` so the created
   reader appears in the already-loaded (empty) `person.readers` collection).
   Because `person.readers` was loaded empty first and the inverse is
   auto-detected, `CollectionProxy#find` uses the stale cached target. Fix the
   create-with-association-object inverse wiring (add to inverse collection on
   `belongsTo` assignment).

Also still bespoke / not yet converged (trails-specific, no direct Rails
counterpart — decide convergence per the deviation policy, do NOT ratify):
`has many/has one loads via inline fallback resolving composite owner key from
query constraints`, `setBelongsTo infers/nullifies inferred composite foreign
key`, `delete single composite has many through join row`, `composite has many
through raises ConfigurationError when target model has composite primary key`,
`polymorphic-through with composite owner primary key requires explicit
single-column primaryKey`. Deferred (blocked on
cpk-counter-cache-column-demodulize-convergence):
`loading cpk association when persisted and in memory differ`.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Fix the three impl gaps (composite source FK in `_pushThrough`; async
      validate on sync chain for official `Client`; inverse-on-create wiring) —
      converge, don't ratify — and land the four blocked Rails-counterpart
      bodies onto canonical models, moving them into the canonical describe and
      removing scratch tables `b_posts`/`b_comments`/`c_posts`/`c_comments` and
      `cpk_thru_doc1s`/`doc2s`/`appt1s`/`appt2s`/`pat1s`/`pat2s` as their last
      consumer is converted. (Impl fixes likely belong in their own PRs — split
      if needed; keep each PR ≤500 LOC, non-overlapping, off main.)
- [ ] Decide convergence for the trails-specific bodies rather than ratifying.
- [ ] FINAL wave: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json` once ALL describes in the
      file (incl. AssociationProxyTest/PreloaderTest defineSchemas) are
      canonical; test:compare delta non-negative.

Hard rules: NO `node:*` imports. NO `process.*` references. Async fs only.
No new third-party runtime deps. 500 LOC ceiling. NO STACKED PRs. Single PR from main.
Test names match Rails verbatim. camelCase only. Open PR as draft.
