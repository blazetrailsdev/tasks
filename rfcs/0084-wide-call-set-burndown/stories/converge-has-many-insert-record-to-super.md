---
title: "converge-has-many-insert-record-to-super"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6407
claim: "2026-08-12T10:46:04Z"
assignee: "converge-has-many-insert-record-to-super"
blocked-by: null
closed-reason: null
---

## Context

Rails' `HasManyAssociation#insert_record` is two lines — set the owner
attributes, then delegate:

```ruby
def insert_record(record, validate = true, raise = false)
  set_owner_attributes(record)
  super
end
```

(`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:61-64`)

`super` is `CollectionAssociation#insert_record`
(`collection_association.rb:377-383`), which picks the raise arm:

```ruby
if raise
  record.save!(validate: validate, &block)
else
  record.save(validate: validate, &block)
end
```

The in-memory counter bump is NOT in `insert_record` — Rails does it in
`HasManyAssociation#concat_records` and `#_create_record`, each wrapping their
`super` in `update_counter_if_success(..., n)`
(`has_many_association.rb:139-149`).

trails' `packages/activerecord/src/associations/has-many-association.ts:158-176`
diverges on all three points: it never delegates to
`super.insertRecord`, it calls `record.save({ validate })` regardless of
`raise` and throws `RecordInvalid` after the fact instead of taking the
`save!` arm, and it folds `updateCounterIfSuccess(saved, 1)` into
`insert_record` itself.

The `raise` arm matters behaviourally: `save!` raises the validation error
from inside the save (so the transaction unwinds at the raise site and the
error carries Rails' message), whereas save-then-throw runs the full save to
completion first. Surfaced by review on #6405, which threaded `save`'s block
through this method and had to forward it past the divergent body.

## Acceptance criteria

1. `HasManyAssociation#insertRecord` is `setOwnerAttributes(record)` followed by
   `super.insertRecord(record, validate, raise, block)` — nothing else.
2. The `raise = true` path goes through `saveBang` (the `super` arm), not
   `save` plus a thrown `RecordInvalid`.
3. `updateCounterIfSuccess` moves to `concatRecords` and `_createRecord`,
   wrapping their `super` calls as in `has_many_association.rb:139-149`, so the
   in-memory counter still moves by the right amount on every path that
   currently relies on it (`<<`, `create`, `concat` of several records).
4. Existing has-many / counter-cache suites stay green; no baseline row is
   added for the shape this story removes.
