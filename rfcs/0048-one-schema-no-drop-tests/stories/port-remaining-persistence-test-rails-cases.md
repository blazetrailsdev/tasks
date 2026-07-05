---
title: "port-remaining-persistence-test-rails-cases"
status: ready
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `converge-persistence-test-one-schema` (which shipped the cleanup
pass: canonical `Mirrors:` header, relocation of the 13 trails-only cases into
`packages/activerecord/src/persistence.trails.test.ts`, and normalization of the
two underscore-style `it(...)` names). That PR left
`packages/activerecord/src/persistence.test.ts` a faithful 1:1 **subset** mirror
of `vendor/rails/activerecord/test/cases/persistence_test.rb`: every `it(...)`
maps to a real `def test_*`, but 36 Rails `def test_*` still have no port.

This story completes AC #2 ("every Rails `def test_*` has a faithful port") by
adding the remaining cases. It was split out because porting all 36 at once
exceeds the 500-LOC PR ceiling and several need extra canonical
models/fixtures/schema. Split into multiple PRs if needed (each from main,
non-overlapping — this .test.ts is the only shared file, so serialize).

## Missing Rails test cases (36)

PersistenceTest class:

- create model with uuid pk populates id (PostgreSQL-only, ChatMessage)
- create model with custom named uuid pk populates id (PostgreSQL-only)
- fills auto populated columns on creation (adapter-specific, Default model)
- increment aliased attribute (accounts, available_credit alias)
- increment nil attribute (topics parent_id)
- increment updates counter in db using offset
- increment with touch updates timestamps
- model with no auto populated fields still returns primary key after insert
  (PkAutopopulatedByATriggerRecord; insert-returning + !SQLite)
- persisted returns boolean (Developer)
- persist inherited class with different table name (aircraft table, Minimalistic subclass)
- reload via querycache (Parrot; query cache enable/uncached)
- save valid record / save invalid record (WrongReply)
- update all / update all with hash
- update attribute for readonly attribute! (Minivan bang)
- update attribute in before validation respects callback chain
- update column for readonly attribute (Minivan)
- update column with default scope / update columns with default scope (DeveloperCalledDavid)
- update column with one changed and one updated / update columns with one changed and one updated
- update columns should not use setter method
- update columns with one readonly attribute (Minivan)
- update object
- update many with active record base object! / ...array of active record base objects!
  / ...duplicated ids! / ...invalid id! (bang variants of existing update_many tests)

QueryConstraintsTest class:

- query constraints list is nil if primary key is nil (developers_projects table)
- query constraints list is nil for non cpk model (Post, Dashboard)
- query constraints list equals to composite primary key (Cpk::Order, Cpk::Book)
- query constraints raises an error when no columns provided
- child keeps parents query constraints (clothing_items reload SQL)
- child keeps parents query contraints derived from composite pk (Cpk::BestSeller)
- child class with query constraints overrides parents (ClothingItem::Sized)

## Acceptance criteria

- [ ] Every Rails `def test_*` in persistence_test.rb has a faithful port in
      `persistence.test.ts` (verify with test:compare mapping — 0 missing).
- [ ] Canonical schema/models/fixtures only; add to `TEST_SCHEMA` /
      canonical models if schema.rb has it (e.g. `aircraft`, `developers_projects`,
      `Default`, `PkAutopopulatedByATriggerRecord`, `DeveloperCalledDavid`,
      `ClothingItem::Sized`, `Cpk::BestSeller`). No bespoke tables.
- [ ] Adapter-gated Rails tests (PostgreSQL-only, insert-returning) gated the
      same way in trails.
- [ ] Surfaced impl gaps fixed to match Rails or filed under
      0023-surfaced-deviations as tracked-pending-convergence; don't bend tests.
