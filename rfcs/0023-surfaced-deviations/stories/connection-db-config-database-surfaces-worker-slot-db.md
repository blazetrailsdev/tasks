---
title: "connectionDbConfig().database surfaces per-worker slot DB under handler suite"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-21T02:46:41Z"
assignee: "connection-db-config-database-surfaces-worker-slot-db"
blocked-by: null
---

## Context

`packages/activerecord/src/insert-all.test.ts` "insert all when table name
contains database" (Rails `insert_all_test.rb:836`) qualifies the table with
the connection's database name. Rails reads `Book.connection_db_config.database`,
but under the trails handler suite `connectionDbConfig().database` returns
`undefined`: `test-setup-worker-db.ts` suffixes the per-worker slot DB onto
`MYSQL_TEST_URL` (e.g. `rails_js_test_2`), yet that name never surfaces on the
db_config hash — `UrlConfig.database` (database-configurations/url-config.ts:31)
sees neither an explicit `database` key nor a parseable URL path carrying it.
The merged test (PR #3748) worked around this by reading the live
`SELECT database()` via `Book.connection.currentDatabase()`.

## Deviation

trails test uses `Book.connection.currentDatabase()` where Rails uses
`Book.connection_db_config.database`. Converge: make the per-worker slot DB
name surface on `connectionDbConfig().database` so the test can read it the
Rails way (and so any other code relying on `db_config.database` under the
handler suite sees the real database).

## Acceptance criteria

- [ ] `Book.connectionDbConfig().database` returns the per-worker slot DB name
      under the MySQL handler suite (not `undefined`).
- [ ] insert-all.test.ts "insert all when table name contains database" reads
      `connectionDbConfig().database` (matching Rails) instead of
      `currentDatabase()`.
- [ ] Test name unchanged; test:compare delta non-negative.
