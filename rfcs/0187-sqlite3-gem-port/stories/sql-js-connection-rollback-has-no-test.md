---
title: "website: SqlJsConnection#rollback has no test"
status: draft
updated: 2026-10-10
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8746 gave every sqlite driver wrapper the sqlite3 gem's `Database#rollback`
(`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:677-680`: `execute "rollback transaction"`, then `true`),
which `SQLite3Adapter#reconnect` now calls (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:814`,
`@raw_connection.rollback rescue nil`). The four activerecord drivers each got a test
(`packages/activerecord/src/sqlite/*.trails.test.ts`, "rollback() rolls the open transaction back and answers true…").
The website's `SqlJsConnection#rollback` (`packages/website/src/lib/frontiers/sql-js-driver.ts:117`) shipped without one;
`packages/website/src/lib/frontiers/sql-js-driver.test.ts` has a single `describe("sqlJsDriver")` with no rollback coverage.
`reconnect` swallows any error from the call (`rescue nil`), so a broken `rollback` on this driver is silent.

## Acceptance criteria

- [ ] `sql-js-driver.test.ts` asserts that `rollback()` inside an open `BEGIN` undoes a write and returns `true`, and that it raises with no transaction open, matching the four activerecord driver tests.
