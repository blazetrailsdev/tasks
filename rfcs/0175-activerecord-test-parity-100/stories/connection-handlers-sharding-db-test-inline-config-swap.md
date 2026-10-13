---
title: "activerecord: connection-handlers-sharding-db test carries Rails' inline config swap instead of withBaseConfigs"
status: ready
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 530
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`connection-handlers-multi-db-test-rails-setup-and-inline-config-swap` converged
`packages/activerecord/src/connection-adapters/connection-handlers-multi-db.test.ts`
(Rails `setup`, `cleanUpConnectionHandler()` teardown, literal `test/db/*.sqlite3`
paths, `inMemoryDb()` gating, inline env / configurations swap) and stopped at the
PR size ceiling. The sharding sibling was left as it was:

- `connection-handlers-sharding-db.test.ts` still wraps six tests in a file-local
  `withBaseConfigs(config, fn)`. Rails writes the swap inline in each test
  (`vendor/rails/v8.0.2/activerecord/test/cases/connection_adapters/connection_handlers_sharding_db_test.rb`):
  `previous_env, ENV["RAILS_ENV"] = ENV["RAILS_ENV"], "default_env"`,
  `@prev_configs, ActiveRecord::Base.configurations = ActiveRecord::Base.configurations, config`,
  and an `ensure` of `configurations = @prev_configs`, `establish_connection(:arunit)`,
  `ENV["RAILS_ENV"] = previous_env`. The multi-db file now shows the converged
  spelling: `getEnv` / `setEnv("TRAILS_ENV", ...)`, a describe-level `prevConfigs`,
  and `try` / `finally`.
- Inlining is mechanical but re-indents every wrapped body: it measured 275
  insertions and 248 deletions, which is why it did not fit beside the multi-db file.
- The file's `afterAll` removes `ActiveRecord::Base`'s `shard_one` writing pool,
  which `clean_up_connection_handler` keeps (`test/cases/test_case.rb:283-286`).
  Deleting it reds the trails-only writing-pool census in
  `packages/activerecord/src/cases/helper.ts` ("This file left connection pool(s)
  in the writing list") on the SQLite, PostgreSQL and MySQL lanes, so it needs the
  census to learn that Rails leaves that pool, not a bare deletion.

## Acceptance criteria

- [ ] `withBaseConfigs` is gone from `connection-handlers-sharding-db.test.ts`; each
      of the six tests carries Rails' inline env / configurations swap and `ensure`.
- [ ] The `afterAll` is removed, with the writing-pool census adjusted so the file
      still passes, or the story records why the census cannot allow it.
- [ ] The file passes on the SQLite, SQLite `:memory:`, PostgreSQL and MySQL lanes.
