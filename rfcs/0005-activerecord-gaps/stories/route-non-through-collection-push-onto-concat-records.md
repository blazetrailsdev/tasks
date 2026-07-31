---
title: "Route non-through collection push onto CollectionAssociation#concatRecords"
status: done
updated: 2026-07-31
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5767
claim: "2026-07-31T22:40:40Z"
assignee: "route-non-through-collection-push-onto-concat-records"
blocked-by: null
closed-reason: null
---

# Route non-through collection push onto CollectionAssociation#concatRecords

## Context

Follow-up from `route-through-collection-writes-onto-association-insert-record`
(PR #5751), which collapsed the _through_ half of the proxy's write path onto
`HasManyThroughAssociation#concat_records` / `#insert_record`. The non-through
half is still a proxy-local reimplementation.

`CollectionProxy#push` (`packages/activerecord/src/associations/collection-proxy.ts`,
the branch after the `options.through` early return) derives the foreign key,
the composite `activeRecordPrimaryKey` pairing, and the polymorphic `<as>_type`
column itself, then defines a local `insertRecord` closure that writes those
attributes and calls `record.save()`. Rails has no such code: `CollectionProxy#<<`
is `proxy_association.concat(records)` (`collection_proxy.rb:1053`), and the FK
assignment is `CollectionAssociation#insert_record` →
`set_owner_attributes(record)` + `record.save`
(`collection_association.rb:439-446`, ported at
`packages/activerecord/src/associations/collection-association.ts:439` and
`has-many-association.ts:142`).

The shared-target prerequisite (#5461) is already in and the through reroute
(#5751) proved the pattern works, so this should be the same shape:
`await assoc.concat(...records)`, deleting the proxy-local FK derivation and
`insertRecord` closure.

Note the two paths already share `concatRecordsLoop`
(`collection-association.ts:1285`) for the `result &&= insert_record` /
`raise Rollback` accumulation, so only the FK-derivation and save half is
duplicated.

## Acceptance criteria

- [ ] `CollectionProxy#push` non-through branch delegates to the association
      object's `concat` / `concatRecords` → `insertRecord`.
- [ ] The proxy-local foreign-key / primary-key / polymorphic-type derivation in
      `push` is deleted, not duplicated — `setOwnerAttributes` is the one
      resolver.
- [ ] `appendBang`'s post-push `RecordInvalid` re-check still behaves (it
      currently leans on `push` having returned).
- [ ] No regression in has_many / polymorphic / composite-PK association suites.
