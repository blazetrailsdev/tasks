---
title: "P3 — MySQL EXPLAIN and optimizer hints (4 skips)"
status: claimed
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: null
claim: "2026-06-08T23:30:45Z"
assignee: "p3-mysql-explain-and-hints"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/mysql_explain_test.rb` and
`test/cases/adapters/abstract_mysql_adapter/optimizer_hints_test.rb`.

**abstract-mysql-adapter/mysql-explain.test.ts (3):** `explain with options as symbol`,
`explain with options as strings`, and `explain options with eager loading` — cover
MySQL-specific `EXPLAIN` formatting with format and other options.

**abstract-mysql-adapter/optimizer-hints.test.ts (1):** `optimizer hints` — verifies
that `/*+ ... */` hint comments are injected correctly by the query builder.

All 4 are standard Rails-mirrored tests. The implementation gap is in the MySQL adapter's
`explain` method and optimizer-hint injection.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 3 skips in `abstract-mysql-adapter/mysql-explain.test.ts` un-skipped and passing.
- [ ] The 1 skip in `abstract-mysql-adapter/optimizer-hints.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(`explain` method) and `activerecord/lib/active_record/relation/query_methods.rb`
(optimizer-hint injection). MySQL EXPLAIN supports `FORMAT=JSON|TREE|TRADITIONAL`.
