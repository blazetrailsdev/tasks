---
title: "mysql2 performQuery ignores its batch kwarg; multi-statements are enabled for the connection's life instead"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7292 (RFC 0119, `wire-mysql-execute-batch-onto-adapter`), which
assigned `execute_batch` and `multi_statements_enabled?` onto `Mysql2Adapter`.

Rails' `Mysql2::DatabaseStatements#perform_query` takes a `batch:` kwarg and uses
it to bracket the query with the multi-statement capability
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41-44`):

```ruby
def perform_query(raw_connection, sql, binds, type_casted_binds, prepare:, notification_payload:, batch: false)
  reset_multi_statement = if batch && !multi_statements_enabled?
    raw_connection.set_server_option(::Mysql2::Client::OPTION_MULTI_STATEMENTS_ON)
    true
  end
```

and restores it in the `ensure` (`:105-108`):

```ruby
ensure
  if reset_multi_statement && active?
    raw_connection.set_server_option(::Mysql2::Client::OPTION_MULTI_STATEMENTS_OFF)
  end
```

trails' port
(`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`,
`performQuery`) declares `batch?: boolean` in its options type and **never reads
it**. There is no enable, no `ensure` restore. PR #7292 substituted a connect-time
`multipleStatements: true` in `Mysql2Adapter.newClient`
(`connection-adapters/mysql2-adapter.ts`) because node `mysql2` exposes no
`set_server_option` — the client flag is only accepted at connect.

Two consequences the substitution leaves behind:

1. **`isMultiStatementsEnabled` has no consumer.** It was wired onto the adapter
   in the same PR because Rails defines it (`:31-38`), but Rails' only caller is
   the `perform_query` batch arm above. Nothing in trails reads it.
2. **The capability is on for every query, not just batches.** Rails' default
   connection has `MULTI_STATEMENTS` OFF and turns it on for the duration of one
   batch; trails leaves it on for the connection's life, so an ordinary
   `execute()` will happily run a `;`-separated payload where Rails would reject
   it. A user config of `flags: ["-MULTI_STATEMENTS"]` also still defeats
   `executeBatch`, since node mysql2's `mergeFlags` honors a `-FLAG` blacklist
   against the default flags that `multipleStatements` pushes.

## Converged shape

Make `performQuery` read `batch` and bracket the query the way Rails does, so the
capability is scoped to the batch rather than the connection, and
`isMultiStatementsEnabled` regains its Rails caller. `newClient`'s unconditional
`multipleStatements: true` comes back out once the query path owns the toggle.

This turns on whether the driver can be made to send `COM_SET_OPTION`.
`node_modules/mysql2/lib/constants/commands.js` defines `SET_OPTION`, but no
public API sends it, so establish first whether a packet can be sent through a
supported surface. If it genuinely cannot, `pnpm tasks block` this with that
finding rather than ratifying the connect-time flag — and note that the narrower
half (rejecting or honoring `flags: ["-MULTI_STATEMENTS"]` instead of silently
producing a broken batch path) is convergeable either way.

## Acceptance criteria

- [ ] `performQuery`'s `batch` parameter is read, mirroring
      `database_statements.rb:41-44` and its `ensure` at `:105-108`.
- [ ] `isMultiStatementsEnabled` is called from that arm, as in Rails.
- [ ] The connect-time `multipleStatements: true` in `newClient` is removed, or
      the story is blocked with the specific driver finding that prevents it.
- [ ] `flags: ["-MULTI_STATEMENTS"]` does not silently yield a broken
      `executeBatch`.
- [ ] `execute-batch.trails.test.ts` stays green, including its
      `multipleStatements: false` case.
