---
title: "P3 — MySQL auto-increment (4 skips)"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: 3050
claim: "2026-06-08T23:10:05Z"
assignee: "p3-mysql-auto-increment"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/auto_increment_test.rb`.

**abstract-mysql-adapter/auto-increment.test.ts (4):** tests cover auto-increment behavior
without a primary key, with a composite primary key, and disabling auto-increment on both
custom and `CREATE TABLE` paths.

All 4 are standard Rails-mirrored tests. The implementation gap is in how the MySQL adapter
handles `AUTO_INCREMENT` when the primary key configuration deviates from the default.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 4 skips in `abstract-mysql-adapter/auto-increment.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(table-options / `AUTO_INCREMENT` handling).
