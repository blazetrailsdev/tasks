---
title: "Query existing_records for unloaded collection in nested-attributes destroy marking"
status: claimed
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-07-13T18:48:29Z"
assignee: "nested-attr-collection-existing-records-query-when-unloaded"
blocked-by: null
closed-reason: null
---

## Context

`assignNestedAttributesForCollectionAssociation`
(`packages/activerecord/src/nested-attributes.ts:818-841`) only marks
already-loaded records for destruction: it reads `loadedCollectionTarget`
(nested-attributes.ts:1010, the proxy's in-memory `_target`, or `[]` when
the collection is unloaded) and marks `_destroy` matches found there.

Rails' `assign_nested_attributes_for_collection_association`
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb`, the
`existing_records` computation) instead does:

```ruby
existing_records = if association.loaded?
  association.target
else
  attribute_ids = ... # ids present in the attributes
  attribute_ids.empty? ? [] : association.scope.where(primary_key => attribute_ids)
end
```

i.e. when the association is NOT loaded, Rails QUERIES the DB
(`scope.where(pk => ids)`) for the referenced ids. trails skips that query
(the code carries an explicit `KNOWN LIMITATION vs Rails` note at
nested-attributes.ts:818-826): for an unloaded collection, destruction
marking and the pre-save size/limit validation interaction are skipped;
the DB rows are still destroyed by the post-save autosave flush, so the
end state is usually correct, but the pre-save in-memory view diverges.

Surfaced while landing PR #4698 (toarray-load-target-hydrate-and-
deletethrough-composite-pk): now that `CollectionProxy#toArray`/`load`
hydrate-and-cache the target, the loaded path is hit more often, but the
unloaded path still diverges. The blocker is that the nested-attributes
SETTER is synchronous (`record[assocName] = params`) and trails' load is
async, so it cannot `await scope.where(...)` inline the way Rails does.

## Acceptance criteria

- [ ] For an UNLOADED collection, `existing_records` are resolved by
      querying `scope.where(primary_key => attribute_ids)` (matching Rails),
      so `_destroy`-flagged existing records are marked and the pre-save
      size/limit validation sees them — without requiring the caller to have
      pre-loaded the association.
- [ ] Resolve the sync-setter vs async-load tension (e.g. eager-resolve the
      existing_records query at assignment time, or restructure so the
      marking happens on the async save path with the same observable
      pre-save state Rails exposes). Document the chosen approach.
- [ ] Add/mirror the Rails nested_attributes test that exercises the
      unloaded-collection destroy path (find the corresponding
      `nested_attributes_test.rb` case; do not invent one).
- [ ] No regression; `test:compare` delta non-negative.
