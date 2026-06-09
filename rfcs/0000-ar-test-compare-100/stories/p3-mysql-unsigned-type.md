---
title: "P3 — MySQL unsigned type (6 skips)"
status: done
updated: 2026-06-09
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 80
priority: 8
pr: 3056
claim: "2026-06-09T13:54:41Z"
assignee: "p3-mysql-unsigned-type"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/unsigned_type_test.rb` and
`test/cases/adapters/abstract_mysql_adapter/sql_types_test.rb`.

**abstract-mysql-adapter/unsigned-type.test.ts (5):** range checks for `UNSIGNED INT` and
`UNSIGNED DECIMAL/FLOAT`, schema-dump round-trip for the unsigned column option, and
deprecation of `unsigned_float`/`unsigned_decimal` aliases.

**abstract-mysql-adapter/sql-types.test.ts (1):** binary-type mapping assertion.

All 6 are standard Rails-mirrored tests. The implementation gap is in the unsigned type
registration and schema-dump path of the MySQL adapter.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 5 skips in `abstract-mysql-adapter/unsigned-type.test.ts` un-skipped and passing.
- [ ] The 1 skip in `abstract-mysql-adapter/sql-types.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(unsigned type registration) and `schema_dumper.rb`.
