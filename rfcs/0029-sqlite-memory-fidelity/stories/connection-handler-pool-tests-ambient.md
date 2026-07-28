---
title: "connection-handler-pool-tests-ambient"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5492
claim: "2026-07-28T12:28:20Z"
assignee: "connection-handler-pool-tests-ambient"
blocked-by: null
closed-reason: null
---

## Context

Audit finding from `audit-residual-memory-sites` (RFC 0029).

Connection-handler/pool tests that Rails runs against the ambient file-backed
`arunit` config, but trails runs on hardcoded `:memory:` HashConfigs:

- `connection-adapters/connection-handler.test.ts:256,260` — Rails
  `connection_adapters/connection_handler_test.rb:14-15` derives its config via
  `ActiveRecord::Base.configurations.configs_for(env_name: "arunit", name:
"primary")`, and its 3-level config test asserts real file paths
  (`:54,:57` — `test/db/readonly.sqlite3`, `test/db/primary.sqlite3`).
- `connection-adapters/connection-handlers-multi-pool-config.test.ts:9` — Rails
  `connection_handlers_multi_pool_config_test.rb:27,54,78` uses
  `"database" => "test/db/primary.sqlite3"` and additionally gates the whole
  block with `unless in_memory_db?` (`:21`), i.e. Rails explicitly declines to
  run this on an in-memory DB.
- `connection-adapters/schema-cache.test.ts:916` — Rails
  `connection_adapters/schema_cache_test.rb:12` uses
  `ARUnit2Model.lease_connection`.
- `connection-adapters/type-lookup.test.ts:13` — Rails
  `connection_adapters/type_lookup_test.rb:10` uses
  `ActiveRecord::Base.lease_connection`.
- `connection-adapters/statement-pool.test.ts:114` — Rails
  `connection_adapters/statement_pool_test.rb:16` builds a bare `TestPool.new`
  with **no database connection at all**.

**Not in scope** (trails-only, judged fidelity-neutral): `pool-config.test.ts`
and `pool-manager.test.ts` have no Rails counterpart file and never connect —
their `:memory:` is an inert HashConfig value, like
`database_configurations/resolver_test.rb`'s.

## Acceptance criteria

- [ ] Each listed file derives its connection/config from the ambient
      file-backed test config instead of a hardcoded `":memory:"` HashConfig.
- [ ] `connection-handlers-multi-pool-config.test.ts` mirrors Rails' file paths
      and its `unless in_memory_db?` gate.
- [ ] `statement-pool.test.ts` needs no adapter at all if the pool under test
      does not require one — match Rails' bare `TestPool.new`.
- [ ] `connection-handler.test.ts` restores the `dbConfig.database` file-path
      assertions Rails makes at `:54,:57`.
- [ ] Test names unchanged. Split across PRs if over 500 LOC.
