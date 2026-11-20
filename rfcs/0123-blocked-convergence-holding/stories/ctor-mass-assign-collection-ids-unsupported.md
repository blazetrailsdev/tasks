---
title: "ctor-mass-assign-collection-ids-unsupported"
status: blocked
updated: 2026-09-24
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-24T21:03:36Z"
assignee: "move-mysql-foreign-keys-onto-abstract-mysql-adapter"
blocked-by: "blocked on sync-collection-mass-assignment-refuses-rails-replace: Model.new is permanently sync (RFC 0087) and Rails' ids_writer (collection_association.rb ids_writer) runs a klass.where lookup at assignment time; CollectionAssociation#syncIdsWrite refuses it, and parking the work is banned. createBang reaches the refusal through new this(mergedAttrs)."
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/test/cases/associations/has_many_through_associations_test.rb` `test_collection_exists` does `Category.create!(author_ids: [author.id], name: "Primary")`. In Rails, `assign_attributes` calls `author_ids=`, which is `ids_writer` (`activerecord/lib/active_record/associations/collection_association.rb`) and runs a `klass.where(pk => ids)` lookup at assignment time. trails' `CollectionAssociation#syncIdsWrite` refuses that lookup during synchronous construction, and `createBang` reaches the refusal through `new this(mergedAttrs)`.

The parked test(s) are in `packages/activerecord/test/cases/associations/has-many-through-associations.test.ts`.

## Ruling

Ruled by the operator on 2026-11-20 (async create paths only): `new Klass` stays synchronous (RFC 0087). The awaited entry points Rails reaches through `new` (`create`, `create!`, `first_or_initialize`, `find_or_initialize_by`, association `build`/`create`) run the query-bearing part awaited, right after construction and before returning, at the position Rails runs it. A bare `new Klass(...)` keeps the synchronous refusal, receipted `PERMANENT` against packages/activerecord/CLAUDE.md § "A record is built with `new Klass` only". Parking the work until save stays banned. This story is an entry dependency of `entry-check-data-layer-parity-is-closed-on-8-0-2` (RFC 0191).

## Acceptance criteria

- `create`, `createBang`, `firstOrCreate*`, `findOrCreateBy*` and association `create`/`build` accept collection `*_ids` attributes. The `ids_writer` lookup runs awaited, after the synchronous construction and before validation or save, in Rails' `assign_attributes` order relative to the other attributes.
- A bare `new Klass({ authorIds: [...] })` keeps the synchronous refusal, receipted `PERMANENT` at the refusal site.
- `test_collection_exists` and any sibling parked tests are un-skipped and pass with their Rails assertions unchanged.
- No deferred or parked assignment that only runs at save.
