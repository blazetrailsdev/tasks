---
title: "Enroll postgresql_rake_test.rb and mysql2_rake_test.rb in parity:test"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6269
claim: "2026-08-09T01:24:25Z"
assignee: "enroll-pg-and-mysql-rake-tests-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

`adapters/postgresql/postgresql_rake_test.rb` and
`adapters/mysql2/mysql2_rake_test.rb` are both whole-file entries in
`UNPORTED_FILES` (`scripts/api-compare/unported-files.ts:225-236`), with the
reason "Tests Rake db:create/drop/migrate tasks via shell exec. Rake and PTY
shell-out have no Node.js equivalent."

That reason is wrong in the same way the SQLite one was. Despite the file
names, nothing in either file drives Rake: every test calls
`ActiveRecord::Tasks::DatabaseTasks` directly — see
`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite_rake_test.rb:182`
for the shape (`ActiveRecord::Tasks::DatabaseTasks.structure_dump @configuration,
filename, "/rails/root"`), which the PG and MySQL files mirror against
`PostgreSQLDatabaseTasks` / `MySQLDatabaseTasks`.

PR for the SQLite half (this story's sibling) removed the sqlite entry, ported
the four `SqliteStructureDumpTest` / `SqliteStructureLoadTest` tests into
`packages/activerecord/src/adapters/sqlite3/sqlite-rake.test.ts` at their Rails
names, and left the remaining 13 as `it.skip` stubs. `sqlite_rake_test.rb` now
reports 4 matched / 13 skipped with 0 gate-mismatch and no new
assertion-count/kind mismatch.

Trails already has ported equivalents for several of these tests living under
trails-invented names in
`packages/activerecord/src/tasks/postgresql-database-tasks.test.ts` and
`packages/activerecord/src/tasks/mysql-database-tasks.test.ts`, so they score
as "extra (TS only)" exactly as the SQLite ones did.

## Acceptance criteria

- [ ] The `postgresql_rake_test.rb` and `mysql2_rake_test.rb` whole-file entries
      are gone from `UNPORTED_FILES`, or narrowed to what is genuinely not
      portable, with an accurate reason.
- [ ] Both files appear as matched rows in `pnpm parity:test`, with the
      already-ported tests credited at their Rails names under their Rails
      `describe` (test class) names.
- [ ] `pnpm parity:test` gate-mismatch stays 0 and the assertion-mismatch
      ratchet stays green (match Rails' assertion kinds — `assert File.exist?`
      is `toBeTruthy()`, not `toBe(true)`).
- [ ] No test renamed to achieve the match; trails-only extras move to a
      `*.trails.test.ts` sibling.
