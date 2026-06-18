---
title: "assoc-associations-test-finder-sql-inverse-on-create"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-18T02:52:06Z"
assignee: "assoc-associations-test-finder-sql-inverse-on-create"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave9-convert-canonical` (RFC 0019). Covers
the `should construct new finder sql after create` Rails counterpart
(`test_should_construct_new_finder_sql_after_create`, Person/Reader/Post).

The faithful port persists `Reader` with `person_id` set, but
`association(person, "readers").find(reader.id)` raises `RecordNotFound`.
`Reader.create({ person, post })` does not populate `person.readers`' in-memory
target via inverse (Rails relies on `inverse_of` so the created reader appears in
the already-loaded (empty) `person.readers` collection). Because `person.readers`
was loaded empty first and the inverse is auto-detected, `CollectionProxy#find`
uses the stale cached target. Fix: add to the inverse collection on `belongsTo`
assignment (create-with-association-object inverse wiring).

The bespoke `should construct new finder sql after create` body lives in the
FIRST `AssociationsTest` describe of
`packages/activerecord/src/associations.test.ts` (scratch tables
`b_posts`/`b_comments`).

- trails: `packages/activerecord/src/associations.test.ts`,
  `packages/activerecord/src/associations.ts` (setBelongsTo inverse wiring)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`
  (`test_should_construct_new_finder_sql_after_create`)

## Acceptance criteria

- [ ] Fix create-with-association-object inverse wiring so a belongsTo assignment
      adds the record to an already-loaded inverse collection (converge, don't
      ratify).
- [ ] Convert the `should construct new finder sql after create` body onto
      canonical Person/Reader/Post + fixtures, move it into the canonical
      describe, and remove scratch tables `b_posts`/`b_comments`.
- [ ] test:compare delta non-negative.
