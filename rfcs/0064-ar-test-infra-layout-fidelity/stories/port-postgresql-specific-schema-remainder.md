---
title: "port-postgresql-specific-schema-remainder"
status: in-progress
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5535
claim: "2026-07-28T21:36:00Z"
assignee: "port-postgresql-specific-schema-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/load-schema-helper.ts` ports
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:4-48` —
the `uuid-ossp` / `pgcrypto` header, the four uuid-PK tables and the
`defaults` table (PR for story `port-adapter-specific-schemas`). Lines 50-225
of that file are still unported, so the postgres lane boots without them:

- `postgresql_times` (`interval`, `scaled_time_interval`) — line 68-71.
- `postgresql_oids` (`t.oid :obj_id`) — line 73-75.
- the identity tables `postgresql_identity_table` /
  `cpk_postgresql_identity_table`, gated on `supports_identity_columns?` —
  lines 50-66.
- the `companies_nonstd_seq` sequence rewiring and the
  `accounts_id_seq`/`developers_id_seq`/... `setval(..., 100)` pass — 81-90.
- `postgresql_timestamp_with_zones`, `postgresql_partitioned_table{,_parent}`
  and the `partitioned_insert_trigger()` plpgsql function — 77-79, 92-128.
- `limitless_fields`, `bigint_array`, `uuid_comments`, `uuid_entries`,
  `uuid_items`, `uuid_messages` — 131-160.
- `test_exclusion_constraints` / `test_unique_constraints` — 162-185.
- the `measurements*` partitioned tables (`supports_partitioned_indexes?`) —
  187-199.
- `add_index(:companies, [:firm_id, :type], name: "company_include_index", ...)`
  — line 201.
- `pk_autopopulated_by_a_trigger_records` + `populate_column()` trigger,
  gated on `supports_insert_returning?` — 203-225.

New tables must be added to `ADAPTER_SPECIFIC_TABLES` in the same file, or
`support/drop-all-tables.ts`'s between-test reset drops them before the first
test in every file.

Several of these are laid inline today by sibling suites — grep for
`bigint_array`, `limitless_fields`, `postgresql_times`, `postgresql_oids`,
`test_exclusion_constraints`, `test_unique_constraints`, `measurements` under
`packages/activerecord/src/adapters/postgresql/` and in `schema-dumper.test.ts`
— and must be repointed at the boot-laid tables in the same change.

## Acceptance criteria

- `loadPostgresqlSpecificSchema` mirrors postgresql_specific_schema.rb:50-225
  table by table (names, columns, defaults verbatim), with the same
  `supports_identity_columns?` / `supports_partitioned_indexes?` /
  `supports_insert_returning?` gates Rails uses.
- Every newly laid table is listed in `ADAPTER_SPECIFIC_TABLES`.
- Siblings that lay these tables inline are repointed at the boot-laid ones.
- Split across PRs if needed to stay under the 500 LOC ceiling.
