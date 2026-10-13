---
title: "connection-handlers-multi-db-test-rails-setup-and-inline-config-swap"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8871
claim: "2026-10-13T20:12:28Z"
assignee: "connection-handlers-multi-db-test-rails-setup-and-inline-config-swap"
blocked-by: null
closed-reason: null
---

## Context

`connection-handlers-db-tests-rails-setup-and-teardown` converged
`packages/activerecord/src/connection-adapters/connection-handlers-sharding-db.test.ts`
(Rails setup, `cleanUpConnectionHandler()` teardown, literal `test/db/*.sqlite3` paths,
`inMemoryDb()` gating) and stopped at the PR size ceiling. Left behind:

- `connection-handlers-multi-db.test.ts` still has the invented shape against
  `vendor/rails/v8.0.2/activerecord/test/cases/connection_adapters/connection_handlers_multi_db_test.rb`:
  - `beforeEach` makes a tmpdir and three empty sqlite files (`asyncFs`, `dbPaths`, `sqliteDb`) and
    builds the handler from a bespoke `HashConfig("test", ...)`. Rails' `setup` (`:13-19`) is
    `ConnectionHandler.new`, `configs_for(env_name: "arunit", name: "primary")`, then
    `establish_connection(db_config)` and `establish_connection(db_config, role: :reading)`.
  - `afterEach` clears both handlers, calls `restoreWorkerConnection()` and deletes the tmpdir.
    Rails' teardown (`:21-23`) is `clean_up_connection_handler`.
  - Config tests pass tmpdir paths where Rails passes and asserts `"test/db/primary.sqlite3"`,
    `"test/db/readonly.sqlite3"`, `"test/db/animals.sqlite3"` (`:90-91,97,101,113-114,...`).
  - The eleven tests inside Rails' `unless in_memory_db?` (`:83-285`) are not gated.
  - Its `withBaseConfigs` stubs `TRAILS_ENV` with `vi.stubEnv` and ends with a floating
    `clearAllConnectionsBang()`; Rails' `ensure` is `configurations = @prev_configs`,
    `establish_connection(:arunit)`, `ENV["RAILS_ENV"] = previous_env`.
- In both files `withBaseConfigs` is a file-local wrapper around what Rails writes inline
  (`previous_env, ENV["RAILS_ENV"] = ...`, `@prev_configs, ActiveRecord::Base.configurations = ...`,
  `ensure`). The sharding file's wrapper now has Rails' body but is still a wrapper.
- The sharding file's `afterAll` removes `ActiveRecord::Base`'s `shard_one` writing pool, which
  `clean_up_connection_handler` keeps (`test/cases/test_case.rb:283-286`) and Rails leaves for the
  rest of the run. It exists for the trails-only writing-pool census in `cases/helper.ts`.
- The sharding file holds a trails-only test, "connectingTo uses the class defaultShard when shard
  is omitted", which belongs in a `.trails.test.ts`.

trails#8808 also edits the multi-db file (the threaded test), so start after it merges.

## Acceptance criteria

- [ ] The multi-db file has Rails' `setup`, `cleanUpConnectionHandler()` as its teardown, no tmpdir
      and no `restoreWorkerConnection()`; config tests use and assert the Rails database paths.
- [ ] The eleven tests Rails gates with `unless in_memory_db?` are gated with `inMemoryDb()`, and no others.
- [ ] `withBaseConfigs` is gone from both files; each test carries Rails' inline env / configurations
      swap and `ensure`.
- [ ] The trails-only `connectingTo` test moves to a `.trails.test.ts`.
- [ ] Both files pass on the SQLite, SQLite `:memory:`, PostgreSQL and MySQL lanes.
