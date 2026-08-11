---
title: "Converge the explicit-host argument in ported connection-adapters module functions (36 rows)"
status: claimed
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 432
priority: null
pr: null
claim: "2026-08-11T13:46:07Z"
assignee: "arel-dialect-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 36 rows across 12 files.

Rails calls these as methods on a receiver (`klass.polymorphic_name`, `assoc.through_reflection`); the trails port calls the module function with the host passed as an explicit first argument, so the argument lists differ by one leading ref. CLAUDE.md's settled mixin idiom is a `this`-typed function assigned to the class, which keeps the call spelled `Klass.polymorphicName()` and the argument list identical to Rails. Converge each site to that shape (or to a plain method call on the host) and delete the corresponding baseline row.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `connection-adapters/abstract-adapter.ts` `column_for_attribute` → `columns_hash`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:tableName)` vs trails `(ref:pool, ref:tableName)`
- `connection-adapters/abstract-adapter.ts` `with_raw_connection` → `synchronize`: Rails (`connection_adapters/abstract_adapter.rb`) `()` vs trails `(ref:run)`
- `connection-adapters/abstract/connection-pool.ts` `acquire_connection` → `try_to_checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `bulk_make_new_connections` → `try_to_checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `complete` → `each_connection_pool`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(nil)`
- `connection-adapters/abstract/connection-pool.ts` `try_to_checkout_new_connection` → `adopt_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:conn)` vs trails `(ref:pool, ref:conn)`
- `connection-adapters/abstract/connection-pool.ts` `try_to_checkout_new_connection` → `checkout_new_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool.ts` `with_connection` → `checkout`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:checkoutTimeout)`
- `connection-adapters/abstract/connection-pool.ts` `with_exclusively_acquired_all_connections` → `attempt_to_checkout_all_existing_connections`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:raiseOnAcquisitionTimeout)` vs trails `(ref:pool, ref:raiseOnAcquisitionTimeout)`
- `connection-adapters/abstract/connection-pool.ts` `with_exclusively_acquired_all_connections` → `with_new_connections_blocked`: Rails (`connection_adapters/abstract/connection_pool.rb`) `()` vs trails `(ref:pool)`
- `connection-adapters/abstract/connection-pool/queue.ts` `add` → `signal`: Rails (`connection_adapters/abstract/connection_pool/queue.rb`) `()` vs trails `(ref:element)`
- `connection-adapters/abstract/connection-pool/queue.ts` `broadcast` → `broadcast`: Rails (`connection_adapters/abstract/connection_pool/queue.rb`) `()` vs trails `(ref:remaining)`
- `connection-adapters/abstract/connection-pool/queue.ts` `broadcast` → `broadcast_on_biased`: Rails (`connection_adapters/abstract/connection_pool/queue.rb`) `()` vs trails `(ref:connections)`
- `connection-adapters/abstract/connection-pool/queue.ts` `signal` → `signal`: Rails (`connection_adapters/abstract/connection_pool/queue.rb`) `()` vs trails `(ref:conn)`
- `connection-adapters/abstract/database-statements.ts` `insert_fixtures_set` → `disable_referential_integrity`: Rails (`connection_adapters/abstract/database_statements.rb`) `()` vs trails `(ref:affectedTables)`
- `connection-adapters/abstract/database-statements.ts` `insert_fixtures_set` → `transaction`: Rails (`connection_adapters/abstract/database_statements.rb`) `(kwargs{requiresNew=bool:true})` vs trails `(ref:doLoadInTransaction, kwargs{requiresNew=bool:true})`
- `connection-adapters/abstract/database-statements.ts` `truncate_tables` → `disable_referential_integrity`: Rails (`connection_adapters/abstract/database_statements.rb`) `()` vs trails `(ref:filtered)`
- `connection-adapters/abstract/schema-definitions.ts` `add_to` → `foreign_key`: Rails (`connection_adapters/abstract/schema_definitions.rb`) `()` vs trails `(ref:foreignTableName, ref:foreignKeyOptions)`
- `connection-adapters/abstract/schema-definitions.ts` `create_column_definition` → `assert_valid_keys`: Rails (`connection_adapters/abstract/schema_definitions.rb`) `(ref:validColumnDefinitionOptions)` vs trails `(ref:rest, ref:validColumnDefinitionOptions)`
- `connection-adapters/abstract/schema-statements.ts` `tables` → `data_source_sql`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(kwargs{type=str:BASE TABLE})` vs trails `(nil, kwargs{type=str:BASE TABLE})`
- `connection-adapters/abstract/schema-statements.ts` `views` → `data_source_sql`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(kwargs{type=str:VIEW})` vs trails `(nil, kwargs{type=str:VIEW})`
- `connection-adapters/postgresql-adapter.ts` `foreign_tables` → `data_source_sql`: Rails (`connection_adapters/postgresql_adapter.rb`) `(kwargs{type=str:FOREIGN TABLE})` vs trails `(nil, kwargs{type=str:FOREIGN TABLE})`
- `connection-adapters/postgresql-adapter.ts` `foreign_tables` → `data_source_sql`: Rails (`connection_adapters/postgresql/schema_statements.rb`) `(kwargs{type=str:FOREIGN TABLE})` vs trails `(nil, kwargs{type=str:FOREIGN TABLE})`
- `connection-adapters/postgresql/database-statements.ts` `handle_warnings` → `call`: Rails (`connection_adapters/postgresql/database_statements.rb`) `(ref:warning)` vs trails `(nil, ref:warning)`
- `connection-adapters/sqlite3/schema-dumper.ts` `virtual_tables` → `virtual_tables`: Rails (`connection_adapters/sqlite3/schema_dumper.rb`) `()` vs trails `(ref:lines)`
- `connection-handling.ts` `clear_query_caches_for_current_thread` → `each_connection_pool`: Rails (`connection_handling.rb`) `()` vs trails `(nil)`
- `connection-handling.ts` `establish_connection` → `call`: Rails (`connection_handling.rb`) `()` vs trails `(ref:modelClass, ref:config)`
- `database-configurations/url-config.ts` `initialize` → `build_url_hash`: Rails (`database_configurations/url_config.rb`) `()` vs trails `(ref:url)`
- `tasks/database-tasks.ts` `charset` → `charset`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(ref:config)`
- `tasks/database-tasks.ts` `collation` → `collation`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(ref:config)`
- `tasks/database-tasks.ts` `create` → `create`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(ref:config)`
- `tasks/database-tasks.ts` `drop` → `drop`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(ref:config)`
- `tasks/database-tasks.ts` `migrate_all` → `db_configs_with_versions`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(nil, ref:targetVersion)`
- `tasks/database-tasks.ts` `migrate_status` → `puts`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(str:)`
- `tasks/database-tasks.ts` `purge` → `purge`: Rails (`tasks/database_tasks.rb`) `()` vs trails `(ref:config)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
