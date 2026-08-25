---
title: "P3 — MySQL SET and ENUM types (4 skips)"
status: done
updated: 2026-06-09
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 60
priority: 17
pr: 3057
claim: "2026-06-09T14:06:45Z"
assignee: "p3-mysql-set-and-enum"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/abstract_mysql_adapter/set_test.rb` and
the ENUM schema-dump portion of `test/cases/adapters/abstract_mysql_adapter/mysql_enum_test.rb`.

**abstract-mysql-adapter/set.test.ts (3):** verifies SET column type — should not be
treated as unsigned, should not be bigint, and schema-dumping round-trip.

**abstract-mysql-adapter/mysql-enum.test.ts (1):** `schema dumping` for MySQL ENUM columns
(the async variant at line 43 of the file).

All 4 are standard Rails-mirrored tests. The implementation gap is in SET/ENUM type
registration and schema-dump paths in the abstract MySQL adapter.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=mysql2 MYSQL_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 3 skips in `abstract-mysql-adapter/set.test.ts` un-skipped and passing.
- [ ] The 1 skip in `abstract-mysql-adapter/mysql-enum.test.ts` un-skipped and passing.
- [ ] No regressions in the broader MySQL adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(type registration for `set` and `enum`) and `schema_dumper.rb`.
