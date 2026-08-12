---
title: "call-args-ar-host-param-connection-adapters-rest"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6413
claim: "2026-08-12T13:46:05Z"
assignee: "call-args-ar-host-param-connection-adapters-rest"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-host-param-connection-adapters` (RFC 0099). That
story listed 36 `kind: "args"` rows; PR #PENDING converged 13 of them (the
`ConnectionPool` private-method cluster via the CLAUDE.md `this`-typed mixin
idiom, `AbstractAdapter#column_for_attribute` → `schema_cache.columns_hash`,
`UrlConfig#build_url_hash`, `SQLite3::SchemaDumper#virtual_tables`, and both
`each_connection_pool` sites) and deleted those baseline rows. The rest did
not fit the PR's LOC ceiling or need a structural change that deserves its own
review; they are listed below, grouped by what blocks them.

### A. Optional leading positional (`data_source_sql(name = nil, type:)`)

Ruby omits the leading positional and passes kwargs only; TS cannot skip a
positional parameter, so the port passes `null` first.

- `connection-adapters/abstract/schema-statements.ts` `tables` / `views`
  → `data_source_sql` (`connection_adapters/abstract/schema_statements.rb`)
- `connection-adapters/postgresql-adapter.ts` `foreign_tables`
  → `data_source_sql` (two rows: `postgresql_adapter.rb`,
  `postgresql/schema_statements.rb`)
- `tasks/database-tasks.ts` `migrate_all` → `db_configs_with_versions`
- `connection-adapters/postgresql/database-statements.ts` `handle_warnings`
  → `call`

Converge by giving the TS signature an overload that accepts the kwargs
object alone (the shape landed for `each_connection_pool` in the parent PR),
or record the language shortcoming with a reviewed per-row `reason`.

### B. Ruby block passed as an explicit argument

- `connection-adapters/abstract-adapter.ts` `with_raw_connection` → `synchronize`
- `connection-adapters/abstract/connection-pool/queue.ts` `add` → `signal`,
  `broadcast` → `broadcast` / `broadcast_on_biased`, `signal` → `signal`
  (Ruby's ConditionVariable wakes a thread that re-reads `@queue`; the Node
  port must hand the element to the promise, `queue.rb:148-165`)
- `connection-adapters/abstract/database-statements.ts` `insert_fixtures_set`
  → `disable_referential_integrity` / `transaction`, `truncate_tables`
  → `disable_referential_integrity`
- `connection-handling.ts` `establish_connection` → `call`

### C. `DatabaseTasks` handler protocol

Rails' `database_adapter_for(db_config).create` instantiates the task class
with the config and calls a no-arg method; trails registers task singletons
and passes `dbConfig` per call (`tasks/database-tasks.ts:211-219`). Converging
means changing the registered-handler protocol across the sqlite3/mysql/pg
task classes and their tests — its own PR.

- `tasks/database-tasks.ts` `charset`, `collation`, `create`, `drop`, `purge`
- `tasks/database-tasks.ts` `migrate_status` → `puts` (`str:`)

### D. Remaining one-offs

- `connection-adapters/abstract/schema-definitions.ts` `add_to` → `foreign_key`,
  `create_column_definition` → `assert_valid_keys`
- `connection-adapters/abstract/connection-pool.ts` `with_connection`
  → `checkout` (trails' `withConnection` carries a `checkoutTimeout` option
  Rails' `with_connection(prevent_permanent_checkout:)` does not have)

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows in
   `scripts/api-compare/call-mismatches-exclude/activerecord/**.json` are
   DELETED by hand (only-shrink; never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
