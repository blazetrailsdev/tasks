---
title: "has-many-through-collection-inverse-sends-reader-append"
status: blocked
updated: 2026-10-21
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-21T14:05:15Z"
assignee: "has-many-through-collection-inverse-sends-reader-append"
blocked-by: "owner decision: converging needs CollectionAssociation#build/buildRecord (sync in Rails and trails, collection-association.ts:195) to await concat's loadTarget when the built record's pk is set; an async build changes public CollectionProxy#build API"
closed-reason: null
---

## Context

`HasManyThroughAssociation#build_record`'s collection-inverse arm in Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:102`) is `record.send(inverse.name) << build_through_record(record)`. That reads the association through its reader and appends with `CollectionProxy#<<`. trails (`packages/activerecord/src/associations/has-many-through-association.ts`, the `inverse.isCollection()` arm) calls `(record.association(inverse.name) as CollectionAssociation).addToTarget(...)` instead. This skips `concat` and its callbacks. trails#9142 converged the has_one arm onto the writer.

## Acceptance criteria

- [ ] The collection arm reads the inverse reader and appends with the proxy's `<<` (`concat`), as Rails does.
- [ ] `has_many_through_associations_test.rb` build-through tests stay green on all adapters.

## Reopened (trails#9157)

The first convergence (trails#9151) wrote `void ...reader.push(...)` inside the sync `buildRecord`. When the built record has its pk set, `ForeignAssociation#foreign_key_present?` (`foreign_association.rb:5-11`) makes `isFindTarget()` true, so `concat` → `loadTarget` runs a SELECT that nothing awaits. That SELECT raced the test's teardown and made the `SQLite :memory:` lane red (red-422d8a49). trails#9157 restored `addToTarget`.

Converging requires an async build path that awaits the `<<`, rather than a floating promise. The same fix covers the sibling has-one arm (`has_many_through_association.rb:104-105`, `record.send("#{inverse.name}=", ...)`). It is `void ...writer(...)` today, and `HasOneAssociation#replace(record, true)` awaits `loadTarget` and can `save` in a transaction, so it floats the same way.
