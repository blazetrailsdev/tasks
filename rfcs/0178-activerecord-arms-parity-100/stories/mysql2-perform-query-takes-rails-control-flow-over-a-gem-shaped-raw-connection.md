---
title: "activerecord: Mysql2 performQuery takes Rails' control flow over a gem-shaped raw connection"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Leftover of `activerecord-converge-invented-control-flow-arms-connection-adapters-mysql-sqlite3`, which
converged 18 of its 20 measured rows. `pnpm parity:api:arms:report --package=activerecord --direction=invented`
still reports:

- `connection-adapters/mysql2/database-statements.ts#performQuery` — `-try +if +if +if +if +if +if`

Rails' body is `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41-109`.
It has five `if` arms and an `ensure`:

- `:42-45` `reset_multi_statement = if batch && !multi_statements_enabled?` turns
  `OPTION_MULTI_STATEMENTS_ON` for the batch, and `:105-109` turns it off in `ensure` when `active?`.
  trails ports neither: `mysql2-adapter.ts` connects with `multipleStatements: true` unconditionally and
  `performQuery` ignores `batch`. The npm `mysql2` client exposes no `set_server_option`.
- `:52` / `:62` / `:73` the `binds.nil? || binds.empty?` / `elsif prepare` / `else` chain, the two
  `begin … rescue ::Mysql2::Error` blocks (`:64-72`, `:76-94`) and `:86-90` `if result`.
- `:97-98` the notification payload is written unconditionally; `:100` `raw_connection.abandon_results!`.

The trails body (`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`, `performQuery`)
carries eleven arms. The six invented ones all adapt the npm client's result shape in line:
`if (prepare) this._trackPrepared?.(…)`, the `driverBinds` date-quoting ternary, the `readTimeout` ternary,
the two-arm `Array.isArray(rawFields)` multi-result normalisation, `if (Array.isArray(result))` splitting
rows from a `ResultSetHeader`, `if (insertId !== undefined)` and `if (notificationPayload)`.

They cannot be deleted in place: the Ruby gem's `Mysql2::Client#query`, `#prepare`, `Statement#execute`,
`#affected_rows`, `#last_id`, `Result#size` / `#fields` / `#to_a` and `#abandon_results!` have no member of
the same shape on `mysql.Connection`. The convergence is a raw-connection wrapper presenting the gem's
surface (async from the start, wrapping the npm client), so `performQuery` reads Rails' arms and the
result-shape adaptation lives behind the gem's method names. RFC `0021-mysql-rawconn-convergence` is the
prior art for that boundary; check its stories before building.

`connection-adapters/mysql/schema-statements.ts#indexes` (`+loop +if`) is the other remaining row in these
files and is owned by `mysql-schema-statements-indexes-ports-the-rails-body` (RFC 0174), not by this story.

## Acceptance criteria

- [ ] `performQuery` takes Rails' control flow (`mysql2/database_statements.rb:41-109`): the
      `reset_multi_statement` arm and its `ensure`, the three-way bind chain with both `rescue` blocks, and
      unconditional payload writes.
- [ ] The npm result-shape adaptation lives behind gem-named members on the raw connection, not in
      `performQuery`.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no
      `mysql2/database-statements.ts#performQuery` row.
- [ ] `adapters/abstract-mysql-adapter/**` and `adapters/mysql2/**` pass with `ARCONN=mysql2`.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented --top=5000 | grep mysql2/database-statements
```
