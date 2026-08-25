---
title: "call-args-ar-connection-adapters-blocks"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6418
claim: "2026-08-12T15:36:57Z"
assignee: "call-args-ar-connection-adapters-blocks"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-host-param-connection-adapters-rest` (RFC 0099).
That story's category A (the optional leading positional on
`data_source_sql(name = nil, type:)`) converged in PR #PENDING: the TS
signature gained an overload accepting the kwargs object alone, and the
`tables` / `views` (`connection_adapters/abstract/schema_statements.rb:52,67`)
and `foreign_tables` (`postgresql_adapter.rb`) rows were deleted.

These remain, each needing a block/structural change of its own:

### Ruby block passed as an explicit argument

- `connection-adapters/abstract-adapter.ts` `with_raw_connection` → `synchronize`
- `connection-adapters/abstract/connection-pool/queue.ts` `add` → `signal`,
  `broadcast` → `broadcast` / `broadcast_on_biased`, `signal` → `signal`
  (Ruby's ConditionVariable wakes a thread that re-reads `@queue`; the Node
  port must hand the element to the promise, `queue.rb:148-165`)
- `connection-adapters/abstract/database-statements.ts` `insert_fixtures_set`
  → `disable_referential_integrity` / `transaction`, `truncate_tables`
  → `disable_referential_integrity`
- `connection-handling.ts` `establish_connection` → `call`
- `connection-adapters/postgresql/database-statements.ts` `handle_warnings`
  → `call` (`postgresql/database_statements.rb:221`
  `ActiveRecord.db_warnings_action.call(warning)`; the port spells it
  `action.call(undefined, warning)` because JS `Function#call` takes the
  receiver first)

### Remaining one-offs

- `connection-adapters/abstract/schema-definitions.ts` `add_to` → `foreign_key`
  (`schema_definitions.rb:242-244`), `create_column_definition` →
  `assert_valid_keys` (`:595` — Ruby's receiver is
  `options.except(...)`, trails' `assertValidKeys(obj, validKeys)` carries it
  as parameter 1)
- `connection-adapters/abstract/connection-pool.ts` `with_connection`
  → `checkout` (trails' `withConnection` carries a `checkoutTimeout` option
  Rails' `with_connection(prevent_permanent_checkout:)` does not have,
  `connection_pool.rb:405-424`)

## Acceptance criteria

1. Each call site passes what the Rails body passes, verified against the
   vendored Rails file named on the row.
2. The corresponding `kind: "args"` baseline rows in
   `scripts/api-compare/call-mismatches-exclude/activerecord/**.json` are
   DELETED by hand (only-shrink; never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
