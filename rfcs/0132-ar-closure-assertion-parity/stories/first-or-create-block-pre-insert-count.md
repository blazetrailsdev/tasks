---
title: "first_or_create block pre-insert count assertion across adapters"
status: claimed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: "2026-09-22T17:58:00Z"
assignee: "collection-proxy-extend-super-chain"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:2727-2745` passes `first_or_create` and
`first_or_create!` a block that runs `assert_equal 5, Client.count`. The block runs inside `build_record`, before the INSERT
(`relation.rb:178-184` → `create(attributes, &block)`). trails#7950 made `Relation#firstOrCreate` / `#firstOrCreateBang` forward the
block (`packages/activerecord/src/relation.ts:926-935`). In trails the block is synchronous (`(r: T) => void`,
`associations/collection-association.ts:240-259` `_createRecord` → `buildRecord(attributes, block)`), but `Client.count()` is async.
A count started in the block races the insert: SQLite reads 5, while PostgreSQL and MariaDB read 6. trails#7950 therefore left out the
in-block assertion and passes no block.

## Acceptance criteria

- Add a cross-adapter way for the two tests to assert the pre-insert count from inside the block. For example, the association
  create path could await a block that returns a promise before inserting (the `_createRecord` / `buildRecord` path), but only if
  that stays faithful to Rails' ordering.
- `first_or_create adds the record to the association` and `first_or_create! adds the record to the association` in
  `packages/activerecord/src/associations/has-many-associations.test.ts` pass the Rails block and assert the count inside it (Rails 4 assertions), green on
  SQLite, PostgreSQL and MariaDB.
