---
title: "port-postgresql-specific-schema-sequences-and-partitions"
status: in-progress
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5551
claim: "2026-07-29T00:15:44Z"
assignee: "port-postgresql-specific-schema-sequences-and-partitions"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `port-postgresql-specific-schema-remainder`, which ported the
plain `create_table` half of
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:50-225`
into `loadPostgresqlSpecificSchema`
(`packages/activerecord/src/support/load-schema-helper.ts`).

Still unported: the raw-DDL sequence/partition block, lines 77-128 —

- `DROP SEQUENCE IF EXISTS companies_nonstd_seq CASCADE`,
  `CREATE SEQUENCE companies_nonstd_seq START 101 OWNED BY companies.id`,
  `ALTER TABLE companies ALTER COLUMN id SET DEFAULT nextval('companies_nonstd_seq')`,
  `DROP SEQUENCE IF EXISTS companies_id_seq` (lines 81-84). `Company` already
  declares `this.sequenceName = "companies_nonstd_seq"`
  (`packages/activerecord/src/test-helpers/models/company.ts:57`), so the
  model half is in place and the sequence itself is not.
- the `setval('<table>_id_seq', 100)` pass over
  `accounts developers projects topics customers orders` (lines 88-90).
- `postgresql_timestamp_with_zones` (lines 92-97), laid inline today at
  `packages/activerecord/src/adapters/postgresql/timestamp.test.ts:134-232`
  (three separate raw-DDL setups) — repoint those at the boot-laid table.
- `postgresql_partitioned_table_parent` / `postgresql_partitioned_table` and
  the `partitioned_insert_trigger()` plpgsql function + `insert_partitioning_trigger`
  (lines 99-128), together with the `DROP FUNCTION IF EXISTS partitioned_insert_trigger()`
  and the three `drop_table ... if_exists: true` calls at lines 77-79, 86.

## Acceptance criteria

- `loadPostgresqlSpecificSchema` mirrors postgresql_specific_schema.rb:77-128
  statement by statement.
- `postgresql_timestamp_with_zones`, `postgresql_partitioned_table` and
  `postgresql_partitioned_table_parent` are listed in `ADAPTER_SPECIFIC_TABLES`.
- `adapters/postgresql/timestamp.test.ts` is repointed at the boot-laid
  `postgresql_timestamp_with_zones`.
