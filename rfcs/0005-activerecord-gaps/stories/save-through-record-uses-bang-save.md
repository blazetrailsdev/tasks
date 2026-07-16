---
title: "save-through-record-uses-bang-save"
status: ready
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of PR #4900.

`saveThroughRecord`
(`packages/activerecord/src/associations/has-many-through-association.ts:594`)
saves the join row with a non-bang, non-raising save:

```ts
const saved = await (joinRecord as any).save({ validate });
if (!saved) {
  if (raise) raiseValidationError(joinRecord);
  return false;
}
```

Rails' `save_through_record` is a **bang** save
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:81-85`):

```ruby
def save_through_record(record)
  association = build_through_record(record)
  if association.changed?
    association.save!
  end
ensure
  @through_records.delete(record)
end
```

So Rails raises `ActiveRecord::RecordInvalid` unconditionally when the join row
fails validation, regardless of the `validate` / `raise` flags threaded through
`insert_record`. Ours raises only when the caller passed `raise: true`, and
otherwise returns `false` — a silently-dropped join row on the default
(`concat` / `<<`) path.

Pre-existing; not introduced by #4900, which only converged the `changed?` gate
on the line above (`if (!joinRecord.changed) return true;`).

Note `insert_record`'s own signature does take `validate` and `raise`
(`has_many_through_association.rb:23`), and passes them to `super` for the
_target_ save — but `save_through_record` takes neither and hard-codes `save!`
for the _join_ row. The distinction is the point: a bad join row is always fatal.

The existing test `insertRecord with validate false skips join record
validation` (`has-many-through-associations.test.ts:2544`) pins the current
trails behavior and will need to be reconciled against Rails when this is fixed
— check whether Rails' `validate: false` reaches the join row at all before
changing it.

## Acceptance criteria

- [ ] `saveThroughRecord` matches `has_many_through_association.rb:81-85`:
      `association.save!` (raising `RecordInvalid`) rather than a flag-gated
      raise, unless a documented reason to diverge is found in the vendored
      source.
- [ ] Confirm from Rails whether `validate: false` / `raise: false` are meant to
      reach the join-row save at all; reconcile
      `insertRecord with validate false skips join record validation` with the
      answer rather than preserving it by default.
- [ ] No regression in the has_many_through / HABTM / nested-through suites.
