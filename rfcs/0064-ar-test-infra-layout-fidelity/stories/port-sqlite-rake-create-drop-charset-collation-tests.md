---
title: "Port the 13 stubbed SqliteDBCreate/Drop/Charset/Collation tests in sqlite-rake.test.ts"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6270
claim: "2026-08-09T01:30:48Z"
assignee: "port-sqlite-rake-create-drop-charset-collation-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/sqlite3/sqlite-rake.test.ts` now maps onto
`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite_rake_test.rb` in
`parity:test` (4 matched / 13 skipped). The 13 skipped are pre-existing
`it.skip` stubs covering four Ruby test classes:

- `SqliteDBCreateTest` (`sqlite_rake_test.rb:8-70`) — 6 tests
- `SqliteDBDropTest` (`:72-129`) — 5 tests
- `SqliteDBCharsetTest` (`:131-148`) — 1 test
- `SqliteDBCollationTest` (`:150-164`) — 1 test

They were stubbed while the whole file was excluded from `parity:test` as
"Rake … via shell exec", which was wrong — nothing in the file drives Rake, all
of it calls `ActiveRecord::Tasks::DatabaseTasks` directly. The exclusion is gone;
the stubs are what is left.

Each depends on Ruby-side plumbing that needs a trails equivalent chosen, which
is why they were not ported alongside the structure dump/load tests:

- `$stdout` / `$stderr` swapped for `StringIO` in `setup` (`:15-16`, `:86-87`),
  asserted with `assert_equal "Created database '…'\n", $stdout.string` (`:35`,
  `:43`, `:126`).
- `assert_called_with(File, :exist?, …)` (`:25`), `assert_called_with(File,
:absolute_path?, …)` (`:95`), `assert_called_with(File, :join, …)` (`:109`),
  `assert_called_with(FileUtils, :rm / :rm_f, …)` (`:101-102`, `:115-116`) —
  assertions on stdlib calls, which in trails land on the `FsAdapter` /
  `PathAdapter` seams rather than on `node:fs` directly.
- `assert_not_called(ActiveRecord::Base, :establish_connection)` (`:49`) and the
  `Base.stub(:establish_connection, proc { … })` arg-collector (`:57`).
- `test_db_retrieves_collation` (`:159-163`) asserts `NoMethodError` — Ruby's
  answer to a task class with no `collation` method; needs the trails analogue
  deciding, since `DatabaseTasks.collation` dispatches through a registered
  handler object rather than by method lookup.

Note trails already has behavioural coverage for most of this under
trails-invented names in `packages/activerecord/src/tasks/sqlite-database-tasks.test.ts`
(`test_db_create_creates_file`, `test_db_create_when_file_exists_raises`,
`test_db_drop_removes_file`, `test_db_drop_missing_raises_no_database_error`,
`test_charset_returns_utf8`) — so this is largely re-expressing existing
assertions at the Rails names and under the Rails test classes, then retiring
the duplicates. Do not rename anything to force a match; port to the Rails name
and delete what it supersedes.

## Acceptance criteria

- [ ] No `it.skip` stubs remain in `sqlite-rake.test.ts`; every test in the file
      runs.
- [ ] `sqlite_rake_test.rb` reports 17/17 matched in `pnpm parity:test`, with
      gate-mismatch still 0.
- [ ] The assertion-mismatch ratchet stays green: match Rails' assertion kinds
      (`assert File.exist?` is `toBeTruthy()`, not `toBe(true)`) and counts.
- [ ] Superseded trails-named duplicates in `tasks/sqlite-database-tasks.test.ts`
      are deleted, not left alongside as extras.
