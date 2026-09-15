---
title: "mysql2-honour-multi-statements-flag"
status: draft
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-fixtures-bulk-insert-and-packet-chunking-cases` ported eight of the ten
`FixturesTest` bulk-insert / packet cases
(`vendor/rails/activerecord/test/cases/fixtures_test.rb:88-333`). The two left
are `bulk insert with multi statements enabled` / `... disabled`
(`fixtures_test.rb:156-251`), which reconnect with `flags: %w[MULTI_STATEMENTS]`
/ `flags: []` and assert `execute("SELECT 1; SELECT 2;")` succeeds / raises
`StatementInvalid`, while `insert_fixtures_set` works either way.

trails cannot express that: `Mysql2Adapter`'s connect
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:~525`) always
passes `multipleStatements: true` to the driver, so a `flags: []` connection
still runs multi-statement SQL. Rails instead leaves the client flag alone and
toggles `set_server_option(OPTION_MULTI_STATEMENTS_ON/OFF)` around a batch
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:31-43,106-107`).
trails' `executeBatch` (`mysql2/database-statements.ts:98-125`) also treats
`flags == null` as multi-statements-enabled, which Rails'
`multi_statements_enabled?` does not.

## Acceptance criteria

- The mysql2 connection honours `flags` for multi statements, and batch
  execution enables it only for the batch, as `mysql2/database_statements.rb` does.
- Both cases are ported at their Rails names in
  `packages/activerecord/src/fixtures.test.ts`, gated to Mysql2/Trilogy.
- Their row is deleted from `scripts/parity/unported-files/unscoped.ts`.
