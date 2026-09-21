---
title: "assertions-has-many-associations-remainder-4"
status: draft
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
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

Fourth slice of `assertions-has-many-associations-remainder`. The `-3` PR converged
get ids (plain / ordered / loaded / unloaded / ignores include / through), creation
respects hash condition, exists respects association scope, clear collection should
not change updated at, dependent association respects optional sanitized/hash
conditions on delete, delete all association with primary key deletes correct
records, depends and nullify, and creating using primary key onto canonical
companies/accounts and posts/readers/authors/comments fixtures in
`packages/activerecord/src/associations/has-many-associations.test.ts`.

Counters now 61 count / 130 kind mismatches against
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining clusters: finder/`assert_queries_count` (find each with conditions, find in
batches, find all/first sanitized, find grouped, find scoped grouped, reload with query
cache), build/new aliased, collection size/empty with dirty target, counter-cache
cluster, `delete_all` with not-yet-loaded collection, dependence for associations with
hash condition (rb:1910, authors fixtures), replace failure, set ids on new record,
extend option, in-memory replacement, composite key, custom primary key on new record.

Known blockers: rb:2506 transaction proxy test; rb:1764 (`has-many-delete-nullify-out-of-scope`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed
  remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
