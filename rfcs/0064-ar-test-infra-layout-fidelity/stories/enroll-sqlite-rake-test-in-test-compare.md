---
title: "sqlite_rake_test.rb is unenrolled, so the ported rake tests score as TS-only extras"
status: done
updated: 2026-08-08
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6248
claim: "2026-08-08T17:15:57Z"
assignee: "enroll-sqlite-rake-test-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

PR #6231 ported four Rails-named tests from
`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite_rake_test.rb`
into `packages/activerecord/src/tasks/sqlite-database-tasks.test.ts`:

- `test_structure_dump` (`sqlite_rake_test.rb:178`)
- `test_structure_dump_with_ignore_tables` (`:192`)
- `test_structure_dump_execution_fails` (`:211`)
- `test_structure_load` (`:252`)

None of them count. `pnpm parity:test` reports no row for
`sqlite_rake_test.rb` at all — grepping its output for `sqlite_rake` or
`sqlite-database-tasks` returns nothing — so the Ruby file reads as entirely
unported and the four ported tests score as "extra (TS only)". The same is true
of the pre-existing tests in that file (`test_db_create_creates_file`,
`test_db_drop_removes_file`, `test_charset_returns_utf8`, and the rest), which
map onto `SqliteDBCreateTest` / `SqliteDBDropTest` / `SqliteDBCharsetTest` in
the same Ruby file.

The gap is manifest enrollment, not naming: the trails file is
`tasks/sqlite-database-tasks.test.ts` while the Ruby is
`adapters/sqlite3/sqlite_rake_test.rb`, and no `PATH_SEGMENT_ALIASES` /
`RUBY_FILE_TS_OVERRIDES` rule in `scripts/api-compare/conventions.ts` maps
between them.

Enrolling a file is four registrations, not one — see the standing note that a
partial enrollment reds CI (the assertion-mismatch mark) while `parity:test`
runs green locally. Budget for all four.

The PG and MySQL task files are very likely in the same position
(`postgresql-database-tasks.test.ts` / `mysql-database-tasks.test.ts` against
`postgresql_rake_test.rb` / `mysql_rake_test.rb`); confirm and enroll them in
the same pass if so, since it is the same mapping rule.

## Acceptance criteria

- [ ] `sqlite_rake_test.rb` appears as a matched row in `pnpm parity:test`
      with the ported tests credited.
- [ ] All four registrations are done, so CI's `Rails API/Test Comparison` job
      agrees with a local `parity:test` run.
- [ ] `pnpm parity:test` delta is positive and `pnpm parity:api` is
      non-negative.
- [ ] No test renamed to achieve the match.
