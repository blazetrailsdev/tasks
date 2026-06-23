---
title: "singular-create-set-new-record-after-save"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: 3942
claim: "2026-06-23T00:51:17Z"
assignee: "singular-create-set-new-record-after-save"
blocked-by: null
---

## Context

Surfaced during review of PR #3721 (has-one-create-bang-array-target).

Rails' `SingularAssociation#_create_record`
(vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:71-78):

```ruby
def _create_record(attributes, raise_error = false, &block)
  record = build_record(attributes, &block)
  saved = record.save
  set_new_record(record)
  raise RecordInvalid.new(record) if !saved && raise_error
  record
end
```

Rails calls `set_new_record(record)` **after** `record.save`. The trails
override at `packages/activerecord/src/associations/singular-association.ts:145`
flips that order: `buildRecord` → (block) → `setNewRecord` → `save`. The
pre-existing comment ("Set FK/inverse before saving so the record persists with
correct owner reference") suggests the FK was moved ahead of save defensively.

In Rails the FK is established inside `build_record` → `initialize_attributes`
(scope*for_create); trails' `buildRecord` likewise applies scope_for_create, so
moving `setNewRecord` after `save` (Rails order) \_should* be viable, but needs
verification that the FK/polymorphic-type columns are present on the built
record before INSERT without the early `setNewRecord`.

This is a pre-existing structural deviation (not introduced by #3721) — the
block timing added in #3721 is already Rails-faithful (yields before save).

## Acceptance criteria

- [x] `SingularAssociation#_createRecord` calls `setNewRecord` **after** `save`,
      matching Rails' ordering — OR document why trails must diverge (FK not set
      by buildRecord alone) as tracked-pending-convergence with evidence.
- [x] has_one / belongs_to create + createBang still persist the FK / inverse
      correctly (inverse-associations + has-one-associations + belongs-to suites
      stay green).
- [x] No api:compare / test:compare regression.
