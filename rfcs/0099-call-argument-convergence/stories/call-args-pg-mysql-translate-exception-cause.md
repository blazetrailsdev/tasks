---
title: "PG and MySQL translate_exception drop the cause: kwarg onto the merged raise-site mechanism"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

Left over from `converge-translate-exception-cause-kwarg` (RFC 0099, PR #6375),
whose own story text noted "the same shape applies to the other adapters'
translators (mysql2, postgresql), which carry the identical divergence".

Rails' `translate_exception` builds each error with `sql:`, `binds:` and
`connection_pool:` only — the driver error is never named in the argument list,
because Ruby sets `Exception#cause` from `$!` at the `raise` site:

- `activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1015-1055`
- `activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:850-880`
- `activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb` (`translate_exception`)

PR #6375 converged the sqlite3 translator and installed the mechanism that
replaces the kwarg: `AbstractAdapter#translateExceptionClass` attaches the
driver error as `cause` after construction, beside the `set_backtrace` analogue
(`abstract_adapter.rb:1130`), guarded on `cause === undefined`. The sqlite3
translator additionally attaches it in its own raise-site proxy for the direct
`throw this._translateException(...)` sites that bypass the public translator.

PG and MySQL still thread `cause:` through the constructor argument list:

- `connection-adapters/postgresql-adapter.ts:3831` — `new StatementInvalid(String(e), { sql, binds, cause: e })`
- `connection-adapters/abstract-mysql-adapter.ts:1486` — same shape
- `connection-adapters/mysql2-adapter.ts:257,266,268` — `AdapterTimeout` / `ConnectionNotEstablished` / `ConnectionFailed`

`error.cause` is load-bearing and asserted across the suite
(`adapter.test.ts:427-472`, `adapters/mysql2/mysql2-adapter.test.ts:340,353`),
so the kwarg cannot be dropped without the raise-site attachment carrying it —
which is exactly what the merged mechanism now does.

## Converged shape

Each `new` in the PG and MySQL translators passes what the Ruby body passes —
`(message, { sql, binds, connectionPool })` — and the driver error arrives as
`cause` from `translateExceptionClass`, plus a raise-site proxy in each
adapter's private `_translateException` for its direct `throw` sites, mirroring
what sqlite3 already does.

## Acceptance criteria

1. Each `new` in the PG / abstract-mysql / mysql2 translators passes what the
   cited Ruby body passes; no `cause:` in the argument list.
2. `error.cause` still resolves to the driver error — the assertions in
   `adapter.test.ts` and `adapters/mysql2/mysql2-adapter.test.ts` stay green
   WITHOUT being edited.
3. Any corresponding `kind: "args"` baseline rows are deleted by hand
   (only-shrink, never `--write`).
4. `pnpm parity:api:calls:args` green; PG and MySQL suites green.
