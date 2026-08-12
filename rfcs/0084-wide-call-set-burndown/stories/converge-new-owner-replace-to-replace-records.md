---
title: "Route replace's new-owner arm through replace_records instead of an inlined remove/concat"
status: blocked
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-12T20:16:53Z"
assignee: "converge-memory-store-dupcoder-and-pruning-guard"
blocked-by: "CollectionAssociation#replace is synchronous in trails and must stay synchronous: it is reached from the constructor's mass-assignment dispatch (base.ts:845-863 `_dispatchAssociationAttrs` -> `syncWrite` -> `replace`, collection-association.ts:202-216), whose callers read `owner.posts` on the next line. Rails' new-owner arm, `replace_records(other_array, original_target)` (collection_association.rb:249, :414-424), is `delete(difference(...))` + `concat(difference(...))`, and in trails every link of that chain is `async` — `delete` -> `deleteOrDestroy` -> `removeRecords` -> `deleteRecords`, and `concat` -> `concatRecords` -> `insertRecord` (collection-association.ts:645-660, 1073-1180). Even though a new owner does no I/O there (existingRecords is empty and `insert_record` is skipped by `unless owner.new_record?`), an await on a non-promise still defers a microtask, so the target mutation would land after the sync caller's next read (see the async-defers-scalar-writes class). The same applies to `skip_strict_loading { load_target }`, which is async too. Converging needs `removeRecords`/`concatRecords`/`delete`/`concat` (plus the HasManyThrough and HABTM overrides) restated as non-async hybrids returning `Promise<T> | T` — the settled trails shape, but a distinct, sizeable prerequisite that must land before this story's four-line body is possible; that is filed as convert-collection-removal-chain-to-sync-hybrid. Delete-side sibling converge-collection-proxy-delete-delegates-to-association landed alongside this bundle in the same PR."
closed-reason: null
---

## Context

`CollectionAssociation#replace` in Rails is four lines
(`activerecord/lib/active_record/associations/collection_association.rb:246-254`):

```ruby
def replace(other_array)
  other_array.each { |val| raise_on_type_mismatch!(val) }
  original_target = skip_strict_loading { load_target }.dup

  if owner.new_record?
    replace_records(other_array, original_target)
  else
    replace_common_records_in_memory(other_array, original_target)
    if other_array != original_target
      transaction { replace_records(other_array, original_target) }
    end
  end
end
```

The new-owner arm is `replace_records(other_array, original_target)`, which is
`delete(difference(target, new_target))` + `concat(difference(new_target,
target))` (`:414-424`) — i.e. it reaches `remove_records` (`:399-408`) and
`concat_records` (`:434-448`) as ordinary calls.

trails (`packages/activerecord/src/associations/collection-association.ts`,
`replace`, the `owner.isNewRecord()` branch, ~line 700-735) hand-inlines that
arm instead: it computes `difference` itself, fires `before_remove` in a local
loop, splices `target`, clears inverses, fires `after_remove`, then calls
`addToTarget` per record and `buildThroughRecordsInMemory`. PR #6432 had to
write a SECOND `catch(:abort)` there, next to the one in `remove_records`,
because the inlined loop is a copy of `remove_records`' first four lines.

Three baseline rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-association.json`
sit on this body: `replace` → `replace_records`, → `skip_strict_loading`,
→ `transaction`.

## Converged shape

`replace`'s new-owner arm calls `replaceRecords(otherArray, originalTarget)`,
and `replaceRecords` is the Rails body (`delete(difference(...))` then
`concat(difference(...))`), so the removal half routes through `removeRecords`
and its single abort catch rather than a second copy of it. The
`skip_strict_loading { load_target }` wrap and the persisted-owner
`transaction` wrap converge with it (note: the `transaction` row is currently
reasoned as a false positive from the sync/async `persistReplace` split — check
that reasoning still holds before deleting it).

Retire the `replace` → `replace_records` and → `skip_strict_loading` rows by
hand (only-shrink; never `--write`).

## Acceptance criteria

- [ ] `replace`'s new-owner arm is Rails' `replace_records(other_array,
original_target)` call, with no inlined before/after_remove loop.
- [ ] The duplicated `catch(:abort)` in that arm is gone — the abort is caught
      once, in `removeRecords`.
- [ ] The `replace` → `replace_records` and `replace` → `skip_strict_loading`
      rows are deleted from the baseline; no new row added.
- [ ] `pnpm parity:api:calls` green; `packages/activerecord/src/associations`
      green, including the has_many :through new-owner replace tests.
