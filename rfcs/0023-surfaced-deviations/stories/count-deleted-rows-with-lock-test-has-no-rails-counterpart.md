---
title: "count-deleted-rows-with-lock.test.ts has no Rails counterpart and invents tables"
status: closed
updated: 2026-07-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "misspecified: adapters/abstract_mysql_adapter/count_deleted_rows_with_lock_test.rb DOES exist in vendor/rails (verified 2026-07-26); the remaining canonical-tables/model-layer convergence for this file is tracked by abstract-mysql-concurrency-tests-model-layer"
---

## Context

Found while inventorying the 40 `new Mysql2Adapter(MYSQL_TEST_URL)` sites for PR #5306 (`mysql-tests-self-built-adapter-burndown`).
`packages/activerecord/src/adapters/abstract-mysql-adapter/count-deleted-rows-with-lock.test.ts`
has **no Rails counterpart**: there is no
`count_deleted_rows_with_lock_test.rb` under
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/`, and
`grep -rl count_deleted_rows vendor/rails/activerecord/test/` returns nothing.

It is also the only file in the burn-down inventory that could not be
classified against a Rails citation, and it is doubly non-canonical: it hand-
rolls `test_bulbs` / `test_authors` tables via raw `CREATE TABLE` in
`beforeEach` (`:15-22`), which the canonical-tables-only rule forbids —
`bulbs` and `authors` are canonical tables in
`vendor/rails/activerecord/test/schema/schema.rb`.

Either it ports something real under a name that lost its provenance (Rails has
row-count-with-lock behaviour tested elsewhere — find it), or it is a trails
invention that should be renamed to `*.trails.test.ts` per the TS-only-extras
convention.

## Acceptance criteria

- [ ] Identify the Rails test this ports, or establish there is none (cite the
      search performed).
- [ ] If it ports something: rename the file/suite to match the Rails test name
      so `parity:test` pairs them, and ride the canonical `bulbs` / `authors`
      tables via `fixtures({ ... })` instead of the raw `CREATE TABLE`s.
- [ ] If it is a trails invention: move it to `*.trails.test.ts` and still
      convert it to the canonical tables.
- [ ] Its second adapter (`:34`, needed for the concurrent-DELETE race) keeps a
      one-line call-site reason either way.
