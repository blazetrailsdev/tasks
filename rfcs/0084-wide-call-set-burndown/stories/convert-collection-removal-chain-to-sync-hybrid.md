---
title: "convert-collection-removal-chain-to-sync-hybrid"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6442
claim: "2026-08-12T22:56:48Z"
assignee: "convert-collection-removal-chain-to-sync-hybrid"
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#replace`'s new-owner arm cannot call Rails'
`replace_records(other_array, original_target)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:246-254`,
`:414-424`) because every link of that chain is `async` in trails while
`replace` itself must stay synchronous — it is reached from the constructor's
mass-assignment dispatch (`packages/activerecord/src/base.ts:845-863`
`_dispatchAssociationAttrs` → `syncWrite` →
`replace`, `associations/collection-association.ts:202-216`), and the caller
reads `owner.posts` on the very next line. An `await` on a non-promise still
defers a microtask, so any async hop drops the target mutation past that read.

The chain: `delete` → `deleteOrDestroy` → `removeRecords` → `deleteRecords`
(`collection-association.ts:645-660`, `:1073-1180`) and `concat` →
`concatRecords` → `insertRecord`. For a _new_ owner none of it does I/O:
`existing_records` is empty so `delete_records` never runs, and
`concat_records` skips `insert_record` under `unless owner.new_record?`
(`collection_association.rb:434-448`).

## Converged shape

Restate `delete`, `deleteOrDestroy`, `removeRecords`, `concat` and
`concatRecords` — plus the `HasManyThroughAssociation` / HABTM overrides of
`removeRecords`, `deleteRecords` and `concatRecords` — as non-`async` bodies
returning `Promise<T> | T`, the settled trails shape for a Ruby-sync path with
an optional I/O tail (`assignAttributes` / `_assignAttributes` in
`persistence.ts`, `set#{Name}Attributes` in `nested-attributes.ts`): run inline,
answer a promise only when a call actually owed I/O, and chain the tail behind
it. Existing `await` call sites keep working unchanged.

## Acceptance criteria

- [ ] The removal/append chain above is sync-capable: for a new-record owner,
      `assoc.delete(...)` / `assoc.concat(...)` complete before the caller's
      next statement.
- [ ] All async call sites unchanged in behaviour; `packages/activerecord/src/associations`
      green on all adapter lanes.
- [ ] Unblocks `converge-new-owner-replace-to-replace-records`, whose blocker
      cites this story.
