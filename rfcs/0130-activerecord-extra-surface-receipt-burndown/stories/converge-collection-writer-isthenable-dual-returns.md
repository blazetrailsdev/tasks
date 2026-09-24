---
title: "converge-collection-writer-isthenable-dual-returns"
status: blocked
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Story's own gate: cannot converge until the constructor's sync replace arm (CollectionAssociation#syncWrite, collection-association.ts:53, via base.ts _dispatchAssociationAttrs) is settled by sync-collection-mass-assignment-refuses-rails-replace (RFC 0155), which is ready/unclaimed as of 2026-09-24. isThenable still present on origin/main df293821ad (collection-association.ts:202,265,293)."
closed-reason: null
---

## Context

Split out of `converge-invented-association-scope-and-key-helpers`, which
converged `invokeScopeLambda`, `applyAssociationScope` and
`normalizeAssociationKey` but could not delete `isThenable`
(`packages/activerecord/src/associations/collection-association.ts`).

`isThenable` is the probe behind the collection writers' sync/async dual
returns: `CollectionAssociation#concat`, `#concatRecords`, `#replace`,
`#deleteOrDestroy`, `#removeRecords`, `#addToTarget` and `replaceRecords`
(collection-association.ts), `HasManyAssociation#concatRecords`
(has-many-association.ts) and the through writers in
has-many-through-association.ts. Rails' bodies are plain awaitable-free
sequences (`collection_association.rb:111-129` `concat`, `:242-256` `replace`,
`:381-398` `delete_or_destroy`, `:400-414` `remove_records`, `:463-478`
`concat_records`, `:521-533` `add_to_target`).

The dual shape exists only so `CollectionAssociation#syncWrite` — reached from
the constructor's association dispatch (`base.ts` `_dispatchAssociationAttrs`)
— can run `replace` synchronously on a new owner. Making the bodies always
`async` defers their target writes past the constructor's synchronous
readers, so this cannot converge until that sync arm is settled by
`sync-collection-mass-assignment-refuses-rails-replace` (RFC 0155).

## Acceptance criteria

- [ ] The collection writer bodies listed above return one shape (awaitable),
      matching the Rails control flow, with no thenable probe.
- [ ] `isThenable` is deleted, with its `@noRailsEquivalent` receipt.
- [ ] `pnpm parity:api:extra:gate` stays green; no name gains a new receipt.
