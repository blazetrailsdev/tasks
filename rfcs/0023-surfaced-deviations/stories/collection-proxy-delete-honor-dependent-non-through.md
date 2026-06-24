---
title: "collection-proxy-delete-honor-dependent-non-through"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: 3750
claim: "2026-06-20T20:27:28Z"
assignee: "collection-proxy-delete-honor-dependent-non-through"
blocked-by: null
---

## Context

`CollectionProxy#delete` for **non-through** has_many associations always
nullifies the FK, ignoring the association's `:dependent` option
(`packages/activerecord/src/associations/collection-proxy.ts:2254–2273` — the
`removeRecords` closure unconditionally builds `_buildNullifyUpdates()` and
calls `scope.updateAll(nullUpdates)`).

Rails' `CollectionProxy#delete` instead delegates to
`CollectionAssociation#delete` → `delete_or_destroy(records, options[:dependent])`
(`activerecord/lib/active_record/associations/collection_proxy.rb`,
`collection_association.rb`), which honors `:delete_all` / `:destroy` and only
nullifies when there is no dependent strategy.

Consequence: for a `dependent: :delete_all` association whose FK is NOT NULL
(e.g. a composite-PK column), `record.assoc.delete(child)` raises a NOT-NULL
constraint violation in trails where Rails would issue a `DELETE`. This was
surfaced by PR #3739 (hm-composite-sharded-delete-tests-faithful-port): the
faithful ports of `test_deleting_models_with_composite_keys` and
`test_sharded_deleting_models` had to route through the association layer
(`record.association(name).delete(...)`) instead of the proxy
(`record.assoc.delete(...)`) that Rails uses, because the proxy path is broken.
Those two tests carry a `tracked-pending-convergence` note pointing here.

The dependent-aware association-layer path itself was made correct in PR #3739
(normalize `"delete"` → `"deleteAll"` in `HasManyAssociation#deleteRecords`) and
in PR #3731 (tuple-form scoping for composite PKs); this story is only about
making `CollectionProxy#delete` _reach_ that path for non-through associations.

## Acceptance criteria

- [ ] `CollectionProxy#delete` for non-through has_many delegates to the
      dependent-aware association-layer `delete` (or otherwise honors
      `options[:dependent]`), matching Rails `delete_or_destroy(records,
options[:dependent])`: `:delete_all` DELETEs, `:destroy` destroys, no
      dependent nullifies.
- [ ] A `dependent: :delete_all` non-through association with a NOT-NULL
      (incl. composite-PK) FK is DELETEd, not nullified, via the proxy
      `record.assoc.delete(child)`.
- [ ] Update the two PR #3739 ports
      (`deleting models with composite keys`, `sharded deleting models` in
      `has-many-associations.test.ts`) to call the proxy
      (`great_author.books.delete(...)` / `blog_post.delete_comments.delete(...)`)
      exactly as Rails does, and drop the `tracked-pending-convergence` note.
- [ ] Existing nullify behavior for non-dependent associations
      (e.g. the `deleting` / `deleting a collection` tests on `clientsOfFirm`)
      is preserved.

## Notes

Possible duplicate of `collection-proxy-delete-honor-dependent-strategy`
(in-progress, PR #3738), which covers the identical non-through
`CollectionProxy#delete` `:dependent` deviation — close/merge into that story
during triage. (This note was moved out of `blocked-by`, which only annotates
`status: blocked` stories; this one is in-progress under PR #3750.)
