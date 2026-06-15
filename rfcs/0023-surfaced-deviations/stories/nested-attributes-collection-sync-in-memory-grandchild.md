---
title: "Nested attributes: unloaded collection assignment populates the in-memory target synchronously so grandchild/autosave saves use it"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-06-15T13:51:46Z"
assignee: "nested-attributes-collection-sync-in-memory-grandchild"
blocked-by: null
---

## Context

Carved out of `nested-attributes-sync-existing-record-updates` (RFC
0023-surfaced-deviations). Covers the **unloaded-collection in-memory target**
slice: when a collection association is not loaded, Rails' nested-attribute
writer still populates the in-memory `@target` so subsequent saves (including
grandchild / autosave cascades) persist the in-memory record without a DB
reload.

trails defers these to the async post-save flush, so the in-memory target is
not populated at assign time. See
`assignNestedAttributesForCollectionAssociation` and `processNestedAttributes`
in `packages/activerecord/src/nested-attributes.ts`.

Depends on / shares machinery with the collection merge-on-load sub-story.

## Acceptance criteria

- Un-skip and implement (Rails-verbatim test names — read the Rails test first):
  - "if association is not loaded and association record is saved and then in
    memory record attributes should be saved"
  - "if association is not loaded and child doesn't change and I am saving a
    grandchild then in memory record should be used"
- Unloaded-collection nested-attribute assignment populates the in-memory target
  synchronously so the in-memory record is used on save / grandchild save.
- 300 LOC ceiling. Single PR from main. Test names match Rails verbatim.
