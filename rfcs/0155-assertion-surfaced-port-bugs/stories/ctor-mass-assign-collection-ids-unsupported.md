---
title: "ctor-mass-assign-collection-ids-unsupported"
status: blocked
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
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

`vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb` `test_collection_exists` does `Category.create!(author_ids: [author.id], name: "Primary")`. trails raises `UnknownAttributeError: unknown attribute 'author_ids' for Category` from `packages/activemodel/src/attribute-assignment.ts:54` (`attributeWriterMissing`), reached through `packages/activerecord/src/attribute-assignment.ts:44` (`_assignAttributes`). Rails routes `assign_attributes` to `public_send("author_ids=")` (`activerecord/lib/active_record/associations/collection_association.rb` `ids_writer`).

`packages/activerecord/src/associations/has-many-through-associations.test.ts` carries the parked `it.skip` test(s) pointing at this story.

## Acceptance criteria

- Constructor / create mass-assignment accepts collection `*_ids` writers.
- The skipped test(s) are un-skipped and pass.
