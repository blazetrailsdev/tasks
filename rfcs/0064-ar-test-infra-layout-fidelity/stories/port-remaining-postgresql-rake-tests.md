---
title: "Port the 33 skipped postgresql_rake_test.rb tests"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6296
claim: "2026-08-09T19:47:23Z"
assignee: "port-remaining-postgresql-rake-tests"
blocked-by: null
closed-reason: null
---

## Context

PR #6269 enrolled `adapters/postgresql/postgresql_rake_test.rb` in `parity:test`
by deleting its whole-file `UNPORTED_FILES` entry — the "Rake and PTY shell-out
have no Node.js equivalent" reason was wrong; every test calls
`ActiveRecord::Tasks::DatabaseTasks` directly. It ported 4 of 37 tests
(`PostgreSQLDBCharsetTest`, `PostgreSQLDBCollationTest`, and two
`PostgreSQLPurgeTest` cases) and left **33 as `it.skip`** in
`packages/activerecord/src/adapters/postgresql/postgresql-rake.test.ts`, each
carrying the Ruby mechanism that blocks it.

This is the sibling of `port-sqlite-rake-create-drop-charset-collation-tests`
(done), which discharged the same backlog for `sqlite_rake_test.rb`.

The skipped tests group by blocker, and the groups are independently portable:

- **`assert_called_with` on the connection double** — `PostgreSQLDBCreateTest`
  (`postgresql_rake_test.rb:38-97`), `PostgreSQLDBDropTest` (`:168-178`),
  `PostgreSQLPurgeTest#establishes connection` (`:258-271`). trails already
  has the double shape these need: PR #6269's `withStubbedConnection` helper
  in the same file is the port of `with_stubbed_connection` (`:272-278`).
- **`$stdout` / `$stderr` StringIO swap** — the `outputs info to stdout` /
  `outputs info to stderr` cases (`:99-135`, `:180-194`). trails writes these
  banners through `stdout`/`stderr` in `tasks/database-tasks.ts:234-243`, and
  `tasks/database-tasks-banners.trails.test.ts` already demonstrates how to
  assert on them.
- **pinned `pg_dump` / `psql` argv** — `PostgreSQLStructureDumpTest` (12 tests,
  `:319-497`) and `PostgreSQLStructureLoadTest` (7 tests, `:498-601`), which
  Rails pins with `assert_called_with(Kernel, :system, ...)`. The SQLite
  enrollment ported its structure-dump equivalents by spying the child-process
  adapter (`adapters/sqlite3/sqlite-rake.test.ts`, "structure dump execution
  fails"), which is the same route here against
  `postgresql-database-tasks.ts#runCmd`.

## Acceptance criteria

- [ ] The `it.skip` count in
      `packages/activerecord/src/adapters/postgresql/postgresql-rake.test.ts`
      drops materially, at Rails names under the existing Rails class describes.
- [ ] No test renamed; no bespoke tables; `pnpm parity:test` gate-mismatch
      stays 0 and the assertion-mismatch ratchet stays green (match Rails'
      assertion KINDS — `assert File.exist?` is `toBeTruthy()`, not `toBe(true)`).
- [ ] Any test left skipped keeps a reason naming the specific Ruby mechanism,
      never a blanket "Ruby-only".
- [ ] Green on the PG lane.

Note: `PostgreSQLPurgeTest#clears active connections` is NOT in scope — it is
blocked on a production divergence tracked separately
(`postgresql-purge-does-not-clear-active-connections`).
