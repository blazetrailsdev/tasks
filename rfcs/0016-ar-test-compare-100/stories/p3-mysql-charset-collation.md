---
title: "P3 — MySQL charset/collation and check-constraint quoting (2 skips)"
status: done
updated: 2026-06-09
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 40
priority: 10
pr: 3058
claim: "2026-06-09T14:18:46Z"
assignee: "p3-mysql-charset-collation"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/charset_collation_test.rb` and
`test/cases/adapters/mysql2/check_constraint_quoting_test.rb`.

**abstract-mysql-adapter/charset-collation.test.ts (1):** `schema dump includes collation` —
verifies that per-column collation is preserved in schema dumps.

**mysql2/check-constraint-quoting.test.ts (1):** `check constraint no duplicate expression
quoting` — verifies that the MySQL adapter does not double-quote the expression of a CHECK
constraint when dumping the schema.

Both are standard Rails-mirrored tests. The implementation gaps are in the MySQL adapter's
schema-dump paths for column collation and CHECK constraint expressions.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] The 1 skip in `abstract-mysql-adapter/charset-collation.test.ts` un-skipped and passing.
- [ ] The 1 skip in `mysql2/check-constraint-quoting.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `abstract_mysql_adapter.rb` (`column_spec` / `column_spec_for_primary_key`
for collation) and `schema_dumper.rb` (check-constraint expression emission). MySQL 8.0+
stores check constraints in `INFORMATION_SCHEMA.CHECK_CONSTRAINTS`.
