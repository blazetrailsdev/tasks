---
title: "translate_exception drops the cause: kwarg and chains the driver error at the raise site"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6375
claim: "2026-08-11T20:06:07Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Left as a reviewed baseline row by PR #6370 (`call-args-ar-kwarg-key-set`).

Rails' `SQLite3Adapter#translate_exception`
(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:692-710`)
builds each error with `sql:`, `binds:` and `connection_pool:` only:

```ruby
RecordNotUnique.new(message, sql: sql, binds: binds, connection_pool: @pool)
```

Ruby sets `Exception#cause` implicitly from `$!` at the `raise` site, so the
driver error is chained without ever being named in the argument list.

trails' `translateException`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) throws the
translated error from inside a `catch`, where JS sets no cause, so it threads
`cause: exception` through the constructor. `error.cause` is load-bearing and
asserted across the suite (`adapter.test.ts:427-472`,
`adapters/mysql2/mysql2-adapter.test.ts:340,353`), so the kwarg cannot simply be
dropped.

Four `kind: "args"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
carry this, keyed `translate_exception` / `new`.

## Converged shape

The argument list at each `new` reads exactly as `sqlite3_adapter.rb:698-702`
— `(message, { sql, binds, connectionPool })` — and the driver error is attached
as the cause somewhere that reproduces Ruby's raise-site `$!` rather than
appearing in the call. The same shape applies to the other adapters' translators
(mysql2, postgresql), which carry the identical divergence, so the answer should
be one mechanism, not a per-adapter patch.

## Acceptance criteria

1. Each `new` in `translate_exception` passes what `sqlite3_adapter.rb:698-702`
   passes.
2. `error.cause` still resolves to the driver error — the assertions in
   `adapter.test.ts` and `adapters/mysql2/mysql2-adapter.test.ts` stay green
   without being edited.
3. The four baseline rows are deleted by hand (only-shrink, never `--write`).
4. `pnpm parity:api:calls:args` green.
