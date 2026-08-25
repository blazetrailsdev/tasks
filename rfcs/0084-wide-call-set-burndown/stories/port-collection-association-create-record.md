---
title: "Port CollectionAssociation#_create_record and route CollectionProxy#create through it"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6410
claim: "2026-08-12T12:46:03Z"
assignee: "activesupport-closure-skip-groups-triage"
blocked-by: null
closed-reason: null
---

## Context

Rails routes every collection `create` through
`CollectionAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-372`):

```ruby
def _create_record(attributes, raise = false, &block)
  unless owner.persisted?
    raise ActiveRecord::RecordNotSaved.new("You cannot call create unless the parent is saved", owner)
  end

  if attributes.is_a?(Array)
    attributes.collect { |attr| _create_record(attr, raise, &block) }
  else
    record = build_record(attributes, &block)
    transaction do
      result = nil
      add_to_target(record) do
        result = insert_record(record, true, raise) { @_was_loaded = loaded? }
      end
      raise ActiveRecord::Rollback unless result
    end
    record
  end
end
```

trails has no `CollectionAssociation#_createRecord` at all. Two consequences,
both found while landing #6407:

1. `CollectionProxy#create` (non-through arm,
   `packages/activerecord/src/associations/collection-proxy.ts:1408-1425`)
   re-implements the body inline — `_buildRaw` + `_addToTarget` +
   `record.save()` + `throw new Rollback()` — and never calls `insertRecord`.
   So the owner FK is set by the build scope rather than by
   `set_owner_attributes`, the `raise` arm never reaches `save!`, and the
   `@_was_loaded` block Rails passes to `insert_record` is absent.
2. Because it bypasses `_createRecord`, it also bypasses
   `HasManyAssociation#_createRecord`'s `update_counter_if_success(super, 1)`
   (`has_many_association.rb:143-149`), which #6407 ported. The in-memory
   counter therefore does not move on the proxy `create` path — it only moves
   on the OO `association.create` path and on `concat_records`.

## Converged shape

Port `CollectionAssociation#_createRecord` at
`packages/activerecord/src/associations/collection-association.ts`, mirroring
collection_association.rb:354-372 (persisted-owner guard raising
`RecordNotSaved`, `buildRecord`, `transaction { addToTarget(record) { result =
insertRecord(record, true, raise) } ; raise Rollback unless result }`), and
have `CollectionProxy#create` / `createBang` delegate to it instead of
inlining the save. `HasManyAssociation#_createRecord` then wraps the real
Rails `super` rather than `Association#_createRecord`.

## Acceptance criteria

1. `CollectionAssociation#_createRecord` exists and matches
   collection_association.rb:354-372 line for line.
2. `CollectionProxy#create` (non-through, non-singular) routes through it; the
   inline `_buildRaw` + `record.save()` + `Rollback` block is deleted.
3. `create!` takes the `raise = true` arm, so validation failures surface from
   `save!` inside the transaction.
4. The in-memory counter-cache bump reaches the proxy `create` path via
   `HasManyAssociation#_createRecord`.
5. Existing has-many / collection-proxy / counter-cache suites stay green; no
   new baseline rows.
