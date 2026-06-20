---
title: "insert_all MySQL database-qualified table name under handler suite"
status: in-progress
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3748
claim: "2026-06-20T23:11:30Z"
assignee: "insert-all-table-name-with-database-qualify"
blocked-by: null
---

## Context

`packages/activerecord/src/insert-all.test.ts` "insert all when table name
contains database" is gated `adapterType !== "mysql"` (MySQL-only, Rails
`insert_all_test.rb:836`) but `ctx.skip()`-pending. Rails qualifies the table
with `connection_db_config.database`; the trails handler suite shards `books`
into a per-worker database that `currentDatabase()` does not name, so the
qualified-table assertion cannot be reproduced under the current harness. No
open tracking story.

## Acceptance criteria

- [ ] Either expose the per-worker database name to `currentDatabase()` or
      provide a harness path that lets a MySQL test assert a
      `database.table`-qualified INSERT.
- [ ] Drop `ctx.skip()`; test runs on MySQL.
- [ ] `test:compare` delta non-negative; test name unchanged.
