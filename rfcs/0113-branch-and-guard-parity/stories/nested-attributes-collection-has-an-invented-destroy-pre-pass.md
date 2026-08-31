---
title: "assign_nested_attributes_for_collection_association marks for destruction twice: delete the invented allow_destroy pre-pass"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assign_nested_attributes_for_collection_association`
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:487-548`)
marks a record for destruction in exactly one place: inside
`assign_to_or_mark_for_destruction` (`:576-579`), called from the main
`attributes_collection.map` loop for the record it just matched.

```ruby
def assign_to_or_mark_for_destruction(record, attributes, allow_destroy)
  record.assign_attributes(attributes.except(*UNASSIGNABLE_KEYS))
  record.mark_for_destruction if has_destroy_flag?(attributes) && allow_destroy
end
```

`packages/activerecord/src/nested-attributes.ts` runs a second, earlier pass that
Rails does not have. Ahead of the loop it walks `attrs` again under
`if (config?.allowDestroy)`, re-finds each id in the loaded target, and calls
`markForDestruction()` directly:

```ts
if (config?.allowDestroy) {
  const loaded = loadedCollectionTarget(record, associationName);
  ...
  const existing = findRecordById(targetModel, loaded, id);
  if (existing) existing.markForDestruction();
}
```

It reads the target through `loadedCollectionTarget`, a trails-only helper that
reaches into `record._collectionProxies` rather than going through
`record.association(name).target` the way the loop below it now does. So one
Rails method has two destruction-marking sites in trails, on two different views
of the same target, and the arm order differs from Rails' (marking happens
before `call_reject_if` rather than after it, inside
`assign_to_or_mark_for_destruction`).

PR #7312 converged the main loop onto Rails' `existing_records` shape, which is
what makes the pre-pass removable: for a loaded association the loop now iterates
`association.target` and calls `assignToOrMarkForDestruction` for every matched
id, so the loaded case the pre-pass exists to serve is already covered.

## Converged shape

Delete the `if (config?.allowDestroy)` pre-pass and the `loadedCollectionTarget`
helper with it, leaving `assignToOrMarkForDestruction` inside the loop as the
single marking site, exactly as Rails has it.

One thing to check before deleting, because it is the reason the pre-pass may
still be load-bearing: the non-autosave `deferred` arm of the same method routes
its attribute hashes to `storePendingNestedAttributes` and they are replayed by
`processNestedAttributes` on save, which handles `_destroy` with its own
`find`/`destroy` rather than through `markForDestruction`. Confirm whether any
test depends on the pre-pass marking a loaded record on that arm; if so, this
story lands after (or with) `delete-pending-nested-attributes-and-the-save-monkey-patch`,
which deletes that arm outright.

## Acceptance criteria

- [ ] The `allowDestroy` pre-pass in
      `assignNestedAttributesForCollectionAssociation` is deleted; destruction is
      marked only by `assignToOrMarkForDestruction` inside the loop, matching
      `nested_attributes.rb:576-579`.
- [ ] `loadedCollectionTarget` is deleted, or its remaining callers are routed
      through `record.association(name).target`.
- [ ] `nested-attributes.test.ts`'s destroy cases (`should destroy an existing
  record if there is a matching id and destroy is truthy`, `should not destroy
  an existing record if allow destroy is false`, and the has_many/habtm
      collection variants) stay green on all three lanes.
- [ ] `pnpm parity:api:calls` non-regressing; no baseline row added.
