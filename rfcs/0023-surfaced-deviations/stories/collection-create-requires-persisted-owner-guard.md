---
title: "CollectionProxy#create/createBang must raise RecordNotSaved on a new-record owner (match _create_record)"
status: in-progress
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4652
claim: "2026-07-06T01:01:57Z"
assignee: "collection-create-requires-persisted-owner-guard"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionAssociation#_create_record` raises before doing anything else
when the owner is not persisted:

```ruby
def _create_record(attributes, raise = false, &block)
  unless owner.persisted?
    raise ActiveRecord::RecordNotSaved.new("You cannot call create unless the parent is saved", owner)
  end
  ...
```

(vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:354-357)

trails' `CollectionProxy#create` / `createBang` (non-through paths)
(packages/activerecord/src/associations/collection-proxy.ts:1281-1299 and
:3804-3814) do NOT guard on `owner.persisted?` — they build the record and open
a transaction / save regardless. Only the through `createBang` path checks it
(collection-proxy.ts:3786). This surfaced while adding the transaction wrap in
PR #4626 (replace-on-target-add-regardless-of-save-result): the wrap now opens a
BEGIN even for a new-record owner, where Rails would have raised first.

## Acceptance criteria

- `firm.clientsOfFirm.create(...)` and `.createBang(...)` on a NEW-record owner
  raise `RecordNotSaved` with message "You cannot call create unless the parent
  is saved" before building/saving or opening a transaction, matching
  `_create_record` for both non-through and through paths.
- Add coverage mirroring any Rails test (e.g. new-record owner create raises).
- Existing create/createBang tests stay green.
