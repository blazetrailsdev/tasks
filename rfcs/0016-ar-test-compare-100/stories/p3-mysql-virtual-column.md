---
title: "P3 — MySQL virtual column (2 skips)"
status: claimed
updated: 2026-06-09
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 50
priority: 19
pr: null
claim: "2026-06-09T15:44:56Z"
assignee: "p3-mysql-virtual-column"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/virtual_column_test.rb`.

**abstract-mysql-adapter/virtual-column.test.ts (2):** `virtual column` (basic read/write
round-trip for a generated column) and `schema dumping` (verifies the generated column
expression is preserved in `schema.rb`/`structure.sql` output).

Both are standard Rails-mirrored tests. The implementation gap is in how the MySQL adapter
reads generated-column metadata from `INFORMATION_SCHEMA` and emits it in schema dumps.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] Both skips in `abstract-mysql-adapter/virtual-column.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(`columns` / `new_column_from_field` — reads `GENERATION_EXPRESSION` and `EXTRA` from
`INFORMATION_SCHEMA.COLUMNS`). MySQL distinguishes `VIRTUAL` vs `STORED` generated columns;
the schema dumper should emit the expression and persistence type.
