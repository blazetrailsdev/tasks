---
title: "appendBang should raise from push's return value, not heuristic record inspection"
status: ready
updated: 2026-07-27
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#appendBang` (`packages/activerecord/src/associations/collection-proxy.ts:4176-4204`)
calls `push(...)` and then re-derives whether the insert failed by inspecting each
record afterwards:

```ts
await this.push(...records);
for (const record of records) {
  if (record.isNewRecord()) throw new RecordInvalid(record);
  if (record.hasChangesToSave) throw new RecordInvalid(record);
}
```

Two problems with the heuristic:

- `hasChangesToSave` is not a failure signal. A record whose `save` succeeded but whose
  callbacks dirtied an attribute afterwards is still persisted, yet trips the second arm.
- It cannot distinguish "this record failed" from "an earlier record failed and this one
  was short-circuited by `concat_records`' `result &&= insert_record` fold" — the whole
  batch is rolled back, so several records look new and the first one in iteration order
  is blamed.

Since #5279, `push` returns `false` when any insert failed on a persisted owner (Rails'
`proxy_association.concat(records) && self`, `collection_proxy.rb:1049`), so the failure
is now directly observable.

Note Rails has no `append!` / `<<!` — `appendBang` is a trails surface. Confirm against
`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb` what, if
anything, it should mirror; `insert_record(record, true, raise)` with `raise = true`
(`collection_association.rb:377-383`) calling `record.save!` is the closest Rails
analogue, and that raises `RecordInvalid` from the failing record itself.

## Acceptance criteria

- `appendBang` derives its raise from `push`'s falsy return rather than post-hoc
  `isNewRecord()` / `hasChangesToSave` inspection.
- The raised `RecordInvalid` names the record that actually failed to save, not
  whichever record happens to come first in iteration order.
- A record that saved successfully but was dirtied by an `after_save` callback no longer
  raises.
- Existing `appendBang` / through-path `RecordInvalid` expectations still pass — see
  `has-many-through-associations.test.ts:1302` and `join-model.test.ts:884`.
- If the audit shows `appendBang` has no Rails counterpart worth keeping, note that in
  the PR rather than deleting it here; removal is a separate story.
