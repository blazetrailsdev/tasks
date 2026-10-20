---
title: "has-many-through-collection-inverse-sends-reader-append"
status: draft
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
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

`HasManyThroughAssociation#build_record`'s collection-inverse arm in Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:102`) is `record.send(inverse.name) << build_through_record(record)`. That reads the association through its reader and appends with `CollectionProxy#<<`. trails (`packages/activerecord/src/associations/has-many-through-association.ts`, the `inverse.isCollection()` arm) calls `(record.association(inverse.name) as CollectionAssociation).addToTarget(...)` instead. This skips `concat` and its callbacks. trails#9142 converged the has_one arm onto the writer.

## Acceptance criteria

- [ ] The collection arm reads the inverse reader and appends with the proxy's `<<` (`concat`), as Rails does.
- [ ] `has_many_through_associations_test.rb` build-through tests stay green on all adapters.
