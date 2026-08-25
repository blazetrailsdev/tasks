---
title: "prepare: is re-derived at each performQuery call site instead of threaded from the Rails caller"
status: draft
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
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

In Rails the `prepare:` kwarg is decided **once, upstream**, and then threaded
down untouched. `select_all` computes it as
`prepare: prepared_statements && preparable`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:74`),
and `raw_execute` passes it straight through to `perform_query`
(`:552-558`), whose prepare arm is a bare `if prepare`
(`connection_adapters/postgresql/database_statements.rb:137`). No adapter
re-derives it.

trails re-derives it at every call site of `performQuery` instead. PR #6330
converged PG's `perform_query` body onto Rails' three arms and, to preserve
behavior, left each caller computing
`prepare: this._shouldPrepare(bindArray)` (or
`options?.prepare === false ? false : this._shouldPrepare(bindArray)`) in
`connection-adapters/postgresql-adapter.ts` — `execute`, `executeMutation`,
`internalExecQuery`, `internalExecute`, `_instrumentedQueryOnClient`.
`_shouldPrepare` (same file) is the inverse of Rails'
`without_prepared_statement?` (`abstract_adapter.rb:1177`), which Rails uses as
a _guard inside_ the bind path, not as the producer of `prepare:`.

Consequences: `execute` prepares whenever binds are present even though its
Rails counterpart is handed `prepare: false` by `raw_execute`'s default, and an
explicitly-passed `prepare: true` is silently downgraded by the local gate. The
divergence is invisible today because the local gate happens to agree with the
upstream value in the common paths.

## Converged shape

- Compute `prepare` where Rails computes it — `select_all` / `internal_exec_query`
  as `preparedStatements && preparable` — and thread the value through
  `rawExecute` / `internalExecute` to `performQuery` unchanged.
- `performQuery`'s arm stays the bare `if (prepare)` it already is.
- Retire `_shouldPrepare` as the producer; if the
  `without_prepared_statement?` guard is still needed, port it at Rails' own
  call site under Rails' name.
- Check the mysql2 and sqlite3 `performQuery` ports for the same pattern while
  here — both were wired onto the Rails argument list by
  `wire-perform-query-on-sqlite3-mysql2-prototypes`.

## Acceptance criteria

- [ ] No adapter-side re-derivation of `prepare:`; the value reaching
      `performQuery` is the one the Rails caller computed.
- [ ] An explicit `prepare: true` is honored rather than re-gated.
- [ ] `adapters/postgresql/postgresql-adapter-perform-query.trails.test.ts`
      (`internalExecute prepares when prepare is true`, `internalExecute does
not prepare when prepare is false`) and the statement-pool suite stay
      green.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:extra --package activerecord` clean.
