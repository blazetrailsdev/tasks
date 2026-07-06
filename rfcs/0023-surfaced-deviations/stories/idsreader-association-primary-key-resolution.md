---
title: "idsReader resolves pluck key via association_primary_key, not target model id"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4688
claim: "2026-07-06T17:05:06Z"
assignee: "idsreader-association-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#idsReader`
(`packages/activerecord/src/associations/collection-association.ts:67-83`)
resolves the pluck key as the target model's `primaryKey`
(`primaryKeyValue(r)` for the loaded/loadTarget branches, `Klass.primaryKey ??
"id"` for the unloaded scope-pluck branch at line 76-79). Rails' `ids_reader`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:51-59`)
plucks `reflection.association_primary_key` in ALL three branches — for a
through/custom-PK association this is the association's own key (e.g.
`Category.primary_key == "name"`), not the target model's `id`.

This is the reader-side parallel to the writer fix in PR #4682
(idswriter-association-primary-key-resolution), which converged `idsWriter` onto
`reflection.association_primary_key` via the rich reflection resolved off
`owner.constructor._reflectOnAssociation`. `idsReader` still diverges: e.g.
`author.essay_category_ids` returns `id`s rather than category `name`s for a
custom-PK through association.

A prior `collection-singular-ids-reader` story (0023) is `done`, but the
association_primary_key resolution in these three branches was not converged —
verify overlap before starting; this story is narrowly the pk-resolution gap.

## Acceptance criteria

- `idsReader` resolves the pluck key via the association's
  `association_primary_key` (rich reflection, as `idsWriter` now does), not the
  target model's `id`, across all three branches (loaded, loadTarget, scope
  pluck).
- Add/enable a test asserting `author.essay_category_ids` returns category
  `name`s (custom PK), mirroring the Rails `ids_reader` behavior.
- Mirror Rails `collection_association.rb:51-59`.
