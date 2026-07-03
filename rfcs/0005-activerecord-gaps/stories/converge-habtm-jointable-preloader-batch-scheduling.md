---
title: "converge-habtm-jointable-preloader-batch-scheduling"
status: ready
updated: 2026-07-03
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `habtm-preloader-jointable-batch-conflation-investigation`, which
pinned the Rails mechanism behind the HABTM join-table preloader conflation
(see `docs/preloader-habtm-batch-conflation-investigation.md`).

Finding: trails' preloader driver `Relation#_preloadAssociationsForRecords`
(`packages/activerecord/src/relation.ts:6169-6181`) passes the **whole**
top-level `includes`/`preload` list to a **single** `Preloader`. Rails'
`Relation#preload_associations`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1321-1328`) instead
runs **one `Preloader.call` per top-level entry** (`preload.each do |associations|
Preloader.new(...).call end`).

Consequence: for `includes(:posts, :otherPosts, :specialPosts)` (Category's
three `class_name: "Post"` HABTMs sharing the `categories_posts` join table),
trails puts all three HABTM through-associations in one `Batch`, so their middle
loaders reach the same `_groupAndLoadSimilar` pass. Their `LoaderQuery` keys are
byte-identical (same table `categories_posts`, same `category_id` key, empty
`valuesForQueries`, same hash), so they collapse into one query and every
join-table row is instantiated as whichever anonymous join model wins the group
(`HABTM_Posts`). The through source preloader then preloads the sibling's source
`belongsTo` (`otherPost`) on `HABTM_Posts` records — which don't declare it —
raising `AssociationNotFound`.

Rails never conflates because its per-entry fan-out means each HABTM runs in its
own `Batch` (`branches == 1`), so the identical `LoaderQuery` keys never meet.
The `Batch`/`Branch`/`LoaderQuery` code itself is already Rails-faithful — the
divergence is solely the driver.

PR #4468 added a trails-local `LoaderQuery._joinModelDiscriminator` guard
(name-sniffs the anonymous `HABTM_*` class into the batch key) as an interim
stand-in. The investigation classified it as (b): a compensation for the driver
divergence, not a Rails-parity key mechanism.

## Acceptance criteria

- [ ] Converge `Relation#_preloadAssociationsForRecords`
      (`relation.ts:6169-6181`) to Rails' per-entry loop (`relation.rb:1325`):
      iterate the association list and build/`call` a fresh `Preloader` per
      top-level entry, instead of one `Preloader` for the whole list.
- [ ] With the driver converged, drop `LoaderQuery._joinModelDiscriminator`
      (the `HABTM_*` name-sniff) added in PR #4468 and its comment.
- [ ] `eager.test.ts` "eager with multiple associations with same table has many
      and habtm" and the Rails-parity HABTM source-name tests still pass with
      the guard removed.
- [ ] Audit query-count impact: trails currently co-batches same-table loaders
      **across** distinct top-level `includes` entries (which Rails does not), so
      per-entry fan-out can change query counts. Reconcile any
      `assertNoQueries`/query-count assertions against Rails behavior and run the
      full associations/eager-loading suite for regressions.
