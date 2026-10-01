---
title: "connection-handlers sharding/multi-db tests: Rails setup, clean_up_connection_handler teardown"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8325, which converged only the first test of
`packages/activerecord/src/connection-adapters/connection-handlers-sharding-db.test.ts`
to `vendor/rails/v8.0.2/activerecord/test/cases/connection_adapters/connection_handlers_sharding_db_test.rb:17-26`.
The rest of the file still carries invented setup:

- `beforeEach` (line 45) makes a tmpdir with `node:os` / `node:path` / `node:fs/promises`
  (lines 2-4) and re-establishes `ActiveRecord::Base` on a `:memory:` SQLite database on
  every lane. Rails has no `setup` at all: the tests run against the suite's own connection.
- `afterEach` (line 54) hand-removes non-baseline pools, resets `defaultShard` and
  `connectionClass`, and calls `restoreWorkerConnection()`. Rails' teardown is
  `clean_up_connection_handler` (`connection_handlers_sharding_db_test.rb:13-15`,
  defined at `test/cases/test_case.rb:280-291`).
- The config tests pass tmpdir paths where Rails passes the literal
  `"test/db/primary.sqlite3"` / `"test/db/primary_shard_one.sqlite3"` and asserts on them
  (`connection_handlers_sharding_db_test.rb:33-34,50,54,67-70,84,90`).
- `withBaseConfigs` (line 17) is a file-local wrapper around what Rails writes inline as
  `@prev_configs, ActiveRecord::Base.configurations = ...` with an `ensure` restore.

`connection-handlers-multi-db.test.ts` has the same shape (tmpdir `beforeEach`, its own
`withBaseConfigs`, `restoreWorkerConnection()` in teardown) against
`connection_handlers_multi_db_test.rb`.

## Acceptance criteria

- [ ] `clean_up_connection_handler` is ported at its Rails name beside the other `test_case.rb` helpers and is the teardown of both files.
- [ ] The sharding file has no `beforeEach` re-establishing `Base`, no tmpdir, and no `node:*` import; config tests use the Rails database paths and assert on them.
- [ ] Tests Rails gates with `unless in_memory_db?` are gated with `inMemoryDb()`, and no others.
- [ ] Both files pass on the SQLite, PostgreSQL and MySQL lanes.
