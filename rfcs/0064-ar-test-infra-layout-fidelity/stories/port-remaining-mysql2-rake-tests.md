---
title: "Port the 24 skipped mysql2_rake_test.rb tests"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6278
claim: "2026-08-09T13:15:56Z"
assignee: "port-remaining-mysql2-rake-tests"
blocked-by: null
closed-reason: null
---

## Context

PR #6269 enrolled `adapters/mysql2/mysql2_rake_test.rb` in `parity:test` by
deleting its whole-file `UNPORTED_FILES` entry — nothing in it drives Rake;
every test calls `ActiveRecord::Tasks::DatabaseTasks` directly. It ported 2 of
26 tests (`MysqlDBCharsetTest`, `MysqlDBCollationTest`) and left **24 as
`it.skip`** in `packages/activerecord/src/adapters/mysql2/mysql2-rake.test.ts`,
each naming the Ruby mechanism that blocks it.

Sibling of `port-sqlite-rake-create-drop-charset-collation-tests` (done) and of
the PG half (`port-remaining-postgresql-rake-tests`).

Groups, all independently portable:

- **`assert_called_with` on the connection double** — `MysqlDBCreateTest`
  (`mysql2_rake_test.rb:41-67`), `MySQLDBDropTest` (`:139-159`). The double
  shape is already in the file: PR #6269's `withStubbedConnection` is the port
  of `Base.stub(:lease_connection, @connection, &block)` (`:235`).
- **`$stdout` / `$stderr` StringIO swap** — `:69-96`, `:161-175`. trails writes
  those banners in `tasks/database-tasks.ts:234-243`;
  `tasks/database-tasks-banners.trails.test.ts` shows the assertion route.
- **pinned `mysqldump` / `mysql` argv** — `MySQLStructureDumpTest` (8 tests,
  `:261-382`) and `MySQLStructureLoadTest` (3 tests, `:383-432`), reachable by
  spying the child-process adapter behind
  `mysql-database-tasks.ts#runCmd`, as the SQLite enrollment did.
- **`MysqlDBCreateWithInvalidPermissionsTest#raises error`** (`:98-123`) raises
  a `Mysql2::Error` from the stubbed connection; decide the trails analogue
  before porting it (trails has no `Mysql2::Error` class today).

## Acceptance criteria

- [ ] The `it.skip` count in
      `packages/activerecord/src/adapters/mysql2/mysql2-rake.test.ts` drops
      materially, at Rails names under the existing Rails class describes.
- [ ] No test renamed; no bespoke tables; `pnpm parity:test` gate-mismatch
      stays 0 and the assertion-mismatch ratchet stays green.
- [ ] Any test left skipped keeps a reason naming the specific Ruby mechanism.
- [ ] Green on the MariaDB lane (this file is `describeIfMysqlAdapter`-gated, so
      it is invisible on every other lane — it cannot be verified on sqlite).

Note: the three `MySQLPurgeTest` tests are NOT in scope — they are blocked on a
production divergence tracked separately
(`mysql-purge-does-not-call-recreate-database`).
