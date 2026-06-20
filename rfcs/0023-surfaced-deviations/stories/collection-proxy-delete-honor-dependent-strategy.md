---
title: "fix: CollectionProxy#delete non-through path ignores :dependent (always nullifies, never delete_all/destroy)"
status: in-progress
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3738
claim: "2026-06-20T19:57:52Z"
assignee: "collection-proxy-delete-honor-dependent-strategy"
blocked-by: null
---

## Context

`CollectionProxy#delete` (non-through path) in
`packages/activerecord/src/associations/collection-proxy.ts:2163-2222`
unconditionally nullifies the FK on the given records
(`_buildNullifyUpdates()` + `updateAll`), regardless of the association's
`:dependent` option.

Rails `CollectionProxy#delete` delegates to the association's
`delete_records(records, dependent)` where `dependent` (from
`reflection.options[:dependent]`, defaulting to `:nullify` for a plain
has_many) selects the strategy:

- `:delete_all` → `scope.delete_all` (DELETEs the rows)
- `:destroy` → `records.each(&:destroy!)`
- else/nil → `update_all(nullified_owner_attributes)` (nullify)

So for a `has_many ... dependent: :delete_all` (e.g.
`ShardedBlogPost.deleteComments`, `CpkAuthor.books`), `collection.delete(x)`
should DELETE the row in Rails, but trails nullifies the FK instead — the row
survives with a null FK. The trails OO `HasManyAssociation#deleteRecords`
(`has-many-association.ts:142`) DOES honor the strategy via `deleteCount`;
only the duplicated proxy fast-path (added in #3610) ignores it.

## Acceptance criteria

- [x] `CollectionProxy#delete` non-through path branches on the effective
      `:dependent` strategy, matching Rails `CollectionProxy#delete` →
      `delete_records`: `:delete_all` → bulk DELETE scoped to the records,
      `:destroy` → per-record destroy, else → nullify.
- [x] Reuse the existing tuple-safe `where(cols, tuples)` scoping for the
      composite-PK case in all branches.
- [x] Add/port coverage for `dependent: :delete_all` proxy delete actually
      removing rows (mirror the relevant Rails has_many test).
