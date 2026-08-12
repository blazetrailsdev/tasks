---
title: "CollectionProxy#delete/#destroy should delegate to the association like Rails"
status: draft
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Now that `CollectionProxy#deleteAll` delegates (PR #6387), its siblings are the
last reimplementations of the same dispatch inside the proxy.

Rails:

- `collection_proxy.rb:620-622` — `def delete(*records) @association.delete(*records).tap { reset_scope } end`
- `collection_proxy.rb:692-694` — `def destroy(*records) @association.destroy(*records).tap { reset_scope } end`

`CollectionAssociation#delete` / `#destroy`
(`collection_association.rb:186-196` → `delete_or_destroy` → `remove_records` →
`delete_records`) already exist in trails at
`packages/activerecord/src/associations/collection-association.ts:568-590`, and
`HasManyAssociation#deleteRecords` /
`HasManyThroughAssociation#deleteRecords` carry the real strategies.

trails instead reimplements the whole path in
`packages/activerecord/src/associations/collection-proxy.ts` (`_deleteStrategy()`
around :2551, the `removeRecords` body around :2440-2540, `_decrementCounterCache`
around :2597), including a proxy-local `:destroy`/`:delete`/`:delete_all`/
`"deleteAll"` mapping that now disagrees with the association layer's public
`deleteAll` vocabulary.

## Acceptance criteria

1. `CollectionProxy#delete` and `#destroy` are the Rails one-liners: delegate to
   `association.delete(...)` / `association.destroy(...)`, then `resetScope()`
   (plus the proxy-local target replay `deleteAll` already documents, since the
   trails proxy keeps its own target copy).
2. The strategy mapping, the counter-cache decrement and the scoped bulk
   delete/nullify live in `CollectionAssociation` / `HasManyAssociation` /
   `HasManyThroughAssociation` only — `_deleteStrategy` and
   `_decrementCounterCache` are deleted from the proxy.
3. Any resulting call/call-arg baseline rows are converged, not added.
4. `pnpm parity:api:calls`, `pnpm parity:api:calls:args`,
   `pnpm parity:api:extra --package activerecord` green; the association suites
   pass.
