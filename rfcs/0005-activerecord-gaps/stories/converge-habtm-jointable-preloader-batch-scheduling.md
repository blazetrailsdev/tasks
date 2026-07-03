---
title: "converge-habtm-jointable-preloader-batch-scheduling"
status: claimed
updated: 2026-07-03
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T13:33:52Z"
assignee: "converge-habtm-jointable-preloader-batch-scheduling"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `habtm-preloader-jointable-batch-conflation-investigation`, which
pinned the Rails mechanism behind the HABTM join-table preloader conflation
(see `docs/preloader-habtm-batch-conflation-investigation.md`).

Finding: trails' `Preloader::Batch` co-groups the middle (through) loaders of
sibling `class_name`-aliased HABTM associations that share one join table
(Category's `posts`/`otherPosts`/`specialPosts` on `categories_posts`) into a
**single** `_groupAndLoadSimilar` pass. Instrumentation
(`[TRAILS-PASS] loaders=HABTM_Posts,HABTM_OtherPosts,HABTM_SpecialPosts`) shows
all three sibling middle loaders runnable in one Batch iteration, with
byte-identical `LoaderQuery` hash keys, so they batch into one query and every
join-table row is instantiated as whichever anonymous join model wins the group.

Rails NEVER co-groups them: every HABTM middle-loader Batch pass has
`branches=1` / a single runnable HABTM loader (verified against
`test_eager_with_multiple_associations_with_same_table_has_many_and_habtm`;
`vendor/rails/.../preloader/batch.rb`, `through_association.rb:70-80`). Rails'
`LoaderQuery#eql?`/`#hash` carry no class identity (same hash for all three),
so the isolation is purely a _scheduling_ property, not a key property.

PR #4468 added a trails-local `LoaderQuery._joinModelDiscriminator` guard
(name-sniffs the anonymous `HABTM_*` class into the batch key) as a stand-in.
The investigation classified it as (b): a compensation for a Batch-scheduling
divergence, not a Rails-parity key mechanism.

## Acceptance criteria

- [ ] Converge trails' `Preloader::Batch`/`Branch` scheduling so sibling
      through-association middle loaders that share a join table are presented
      to `_groupAndLoadSimilar` one branch-subtree at a time, matching Rails'
      observed `branches=1`-per-HABTM-pass behavior.
- [ ] With the scheduler converged, drop `LoaderQuery._joinModelDiscriminator`
      (the `HABTM_*` name-sniff) added in PR #4468 and its comment.
- [ ] `eager.test.ts` "eager with multiple associations with same table has many
      and habtm" and the Rails-parity HABTM source-name tests still pass with
      the guard removed.
- [ ] No regression across the preloader/eager-loading suite (the scheduler
      change has broad blast radius — run the full associations/eager tests).
