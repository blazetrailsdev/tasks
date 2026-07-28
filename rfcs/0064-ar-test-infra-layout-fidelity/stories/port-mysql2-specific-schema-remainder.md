---
title: "port-mysql2-specific-schema-remainder"
status: done
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5534
claim: "2026-07-28T21:24:03Z"
assignee: "port-mysql2-specific-schema-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/load-schema-helper.ts` ports
`vendor/rails/activerecord/test/schema/mysql2_specific_schema.rb:4-26` —
`datetime_defaults`, `timestamp_defaults` and `defaults` (PR for story
`port-adapter-specific-schemas`). Lines 28-95 are still unported, so the mysql
lane boots without them:

- `binary_fields` (line 28-49): `var_binary`/`var_binary_large`, the
  tinyblob/blob/mediumblob/longblob and tinytext/text/mediumtext/longtext
  columns, the `size: :tiny|:medium|:long` binary/text variants, and
  `t.index :var_binary`.
- `key_tests` (51-58): `options: "CHARSET=utf8 ENGINE=MyISAM"` plus a
  `type: :fulltext` index, a `using: :btree` index and a plain one.
- `collation_tests` (60-64): `utf8mb4_bin` / `utf8mb4_general_ci` collated
  columns.
- the `ten()` and `topics(IN num INT)` stored procedures (66-82).
- `pk_autopopulated_by_a_trigger_records` + `before_insert_trigger`, gated on
  `supports_insert_returning?` (84-95).

New tables must be added to `ADAPTER_SPECIFIC_TABLES` in the same file, or
`support/drop-all-tables.ts`'s between-test reset drops them before the first
test in every file.

`binary_fields`, `key_tests` and `collation_tests` are laid inline today by
`schema-dumper.test.ts` and by suites under
`packages/activerecord/src/adapters/abstract-mysql-adapter/` — grep for those
names — and must be repointed at the boot-laid tables in the same change.

## Acceptance criteria

- `loadMysql2SpecificSchema` mirrors mysql2_specific_schema.rb:28-95 table by
  table (names, columns, indexes, table options, collations verbatim),
  including the two stored procedures and the trigger arm behind the same
  `supports_insert_returning?` gate Rails uses.
- Every newly laid table is listed in `ADAPTER_SPECIFIC_TABLES`.
- Siblings that lay these tables inline are repointed at the boot-laid ones.
- Split across PRs if needed to stay under the 500 LOC ceiling.
