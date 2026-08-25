---
title: "Gate pk_autopopulated_by_a_trigger_records in the postgres boot list"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5579
claim: "2026-07-29T17:45:54Z"
assignee: "pg-boot-list-ignores-insert-returning-gate"
blocked-by: null
closed-reason: null
---

## Context

`ADAPTER_SPECIFIC_TABLES.postgres` in
`packages/activerecord/src/support/load-schema-helper.ts` lists
`pk_autopopulated_by_a_trigger_records` unconditionally, but
`loadPostgresqlSpecificSchema` only lays it inside
`if (adapter.supportsInsertReturning())`, mirroring Rails'
`if supports_insert_returning?` block at
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:203-225`.

This is the exact defect class already fixed twice in this arm: story
`mysql-specific-table-list-ignores-insert-returning-gate` (done) for the mysql
arm, and PR #5550 for `postgresql_identity_table` /
`cpk_postgresql_identity_table`, which now splice in behind
`pg.supportsIdentityColumns()`. The postgres `pk_autopopulated_*` entry was left
untouched because it was outside that review's scope.

Impact is latent rather than live: `supports_insert_returning?` on PostgreSQL is
`true` for every server version trails supports (PG >= 8.2), so no lane
currently mis-resets. It is a correctness-of-the-list issue — the boot list is
supposed to be kept in step with the loader's support gates, and this entry
silently is not.

## Acceptance criteria

- `pk_autopopulated_by_a_trigger_records` is spliced into the postgres arm
  behind `supportsInsertReturning()`, matching the `supportsIdentityColumns()`
  and `supportsPartitionedIndexes()` entries beside it.
- No other entry in the arm is ungated relative to its loader block.
