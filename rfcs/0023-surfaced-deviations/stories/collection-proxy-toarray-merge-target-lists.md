---
title: "CollectionProxy#toArray must apply merge_target_lists merge like load() (prefer in-memory, refresh attrs, preserve destroy marks)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3382 (story `nested-attributes-collection-merge-on-load`) completed
`CollectionProxy#load` to mirror Rails' `CollectionAssociation#merge_target_lists`
(`collection_association.rb:335-351`): on load it prefers in-memory instances by
primary key, preserves DB order, appends new records last, and refreshes each
matched record's unchanged attributes from the DB row (skipping
`changedAttributeNamesToSave` / `readonlyAttributes`).

`CollectionProxy#toArray` (`packages/activerecord/src/associations/collection-proxy.ts`,
~line 589) was NOT updated and still diverges:

```ts
async toArray(): Promise<T[]> {
  const results = await this._execLoad();
  const unsaved = this._target.filter((r) => r.isNewRecord());
  return unsaved.length > 0 ? [...results, ...unsaved] : results;
}
```

It appends only unsaved (`isNewRecord`) records but does NOT prefer in-memory
persisted instances by PK, does not refresh attributes, and does not preserve
in-memory dirty/destroy state for persisted rows. In Rails, both `to_a` and
`load_target` funnel through the same `load_target`, so a `to_a` read sees the
merged target. In trails a direct `proxy.toArray()` after assigning nested
attributes by id (or otherwise mutating the in-memory persisted target) returns
fresh DB rows, silently overwriting unsaved nested updates and dropping
scheduled-destroy marks for persisted records.

`load()` already extracted the merge into `_refreshUnchangedAttributes`; the fix
is to route `toArray()` through the same merge (or share a helper) so both read
paths produce the identical merged target.

## Acceptance criteria

- `CollectionProxy#toArray()` applies the same `merge_target_lists` merge as
  `load()`: in-memory persisted instances preferred by PK, attribute refresh
  (skip changed/readonly), DB order preserved, new records appended last.
- A `toArray()` read after assigning nested updates/destroys by id to an
  (un)loaded collection reflects the in-memory unsaved updates and destroy marks
  (mirror the four PR #3382 tests but via `toArray()` instead of `loadTarget()`).
- No regression in existing collection-proxy / has-many / eager suites.
- Read the Rails `to_a` → `records` → `load_target` path first; test names match
  Rails verbatim where a corresponding Rails test exists.
