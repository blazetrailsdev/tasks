---
title: "P3 — MySQL stored procedures / multi-result (3 skips)"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: 3048
claim: null
assignee: null
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/sp_test.rb`.

**abstract-mysql-adapter/sp.test.ts (3):** tests that stored procedures returning multiple
result sets are handled correctly — `multi results`, `multi results from select one`, and
`multi results from find by sql`.

Multi-result-set support requires the mysql2 driver to iterate through result packets. Verify
whether the Node.js `mysql2` package supports multi-statement / stored-procedure result sets
(it does via `multipleStatements` connection option); the gap is wiring that through the
adapter's query path and mapping results to `ActiveRecord` records.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 3 skips in `abstract-mysql-adapter/sp.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb`
(`execute_and_free` multi-result iteration). The Node `mysql2` driver requires
`multipleStatements: true` to surface additional result sets; confirm this is safe to enable
in the adapter's connection options or scope it to the SP query path.
