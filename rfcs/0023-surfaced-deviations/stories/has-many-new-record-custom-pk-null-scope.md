---
title: "has_many on new-record owner with custom PK present wrongly applies none (AND 1=0)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Discovered while converting `associations/has-many-associations.test.ts` to the
canonical schema (story `assoc-has-many`, RFC 0019). The Rails tests
`test_custom_primary_key_on_new_record_should_fetch_with_query` and
`test_association_primary_key_on_new_record_should_fetch_with_query` assert that
a **new-record owner whose custom primary key is present** still fetches its
`has_many` collection (Rails `ForeignAssociation#foreign_key_present?`,
foreign_association.rb:5 — a new record with its PK assigned is fetchable).

trails diverges: for a canonical model with a _registered_ has_many reflection
(e.g. `Subscriber.has_many :subscriptions`, `Author.has_many :essays` with
`primary_key:`), `CollectionProxy#size` returns the correct count via the COUNT
path, but `toArray()` returns `[]`. The association scope built through the OO
`CollectionAssociation#scope()` applies `none` (`AND 1=0`) for new-record
owners.

Root cause (observed via instrumentation in
`associations/foreign-association.ts#foreignKeyPresentFor`): the scope chain
evaluates `foreignKeyPresentFor` twice. The first call resolves
`reflection.activeRecordPrimaryKey = "nick"` (present → fetchable). A **second**
reflection in the chain resolves `activeRecordPrimaryKey === undefined`, falls
back to `"id"`, finds `id` blank on the new record, and reports the FK absent →
`isNullScope()` returns true → `scope()` appends `none()`.

- trails: `associations/collection-association.ts` (`isNullScope`/`scope`),
  `associations/foreign-association.ts` (`foreignKeyPresentFor`),
  `reflection.ts` (`activeRecordPrimaryKey` returning undefined for the second
  reflection in the chain).
- Rails: `activerecord/lib/active_record/associations/foreign_association.rb`,
  `activerecord/lib/active_record/associations/collection_association.rb`.

The two affected tests are currently `it.skip` with a
`tracked-pending-convergence` comment pointing here, in
`associations/has-many-associations.test.ts`
(`HasManyAssociationsTestPrimaryKeys`).

## Acceptance criteria

- [ ] Identify why the second reflection in the new-record has_many scope chain
      resolves `activeRecordPrimaryKey` to `undefined` and fix it so a
      custom-PK new-record owner reports `foreign_key_present?` correctly.
- [ ] `new Subscriber({nick}).subscriptions` and `new Author({name}).essays`
      fetch their collections (no spurious `AND 1=0`); `size()` and `toArray()`
      agree.
- [ ] Un-skip the two `it.skip` tests in `HasManyAssociationsTestPrimaryKeys`
      and confirm they pass against Rails behavior.
- [ ] No regression in existing has_many new-record null-scope tests (a genuinely
      blank-PK new record must still short-circuit with no query).
