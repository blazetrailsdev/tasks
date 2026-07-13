---
title: "logSql should translate driver errors with sql+binds like Rails' log"
status: done
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4837
claim: "2026-07-13T18:08:27Z"
assignee: "logsql-translate-exception-with-sql-binds-parity"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while implementing `internal-exec-query-bind-aware-shared-returning-readback` (PR #4684).

Rails' `AbstractAdapter#log` rescue translates driver errors with the statement
context: `raise translate_exception_class(exception, sql, binds)`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`).
trails' `logSql`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1351`)
does NOT translate — it only sets `payload.exception`/`payload.exception_object`
and rethrows the raw driver error. So `internalExecQuery`/`rawExecQuery` error
paths rely on `withRawConnection`'s `translateExceptionClass(e, null, null)`
(`abstract-adapter.ts:2118`), which produces the correct AR error class but with
`sql = null` / `binds = []` — the statement context is lost.

Because of this, PR #4684 had to work around it in the PG adapter: its
`internalExecute` bound path pre-translates with
`this._translateException(e, runSql, bindArray)` before `withRawConnection`
re-catches (`postgresql-adapter.ts` ~2136). `withRawConnection` then passes the
already-`ActiveRecordError` through unchanged (`abstract-adapter.ts:2269`
short-circuits on `instanceof ActiveRecordError`).

A shared fix in `logSql` (translate like Rails' `log`) would let that
per-adapter workaround be removed and give every `internalExecQuery` /
`rawExecQuery` caller faithful `sql`/`binds` on translated errors.

Caveat — avoid double-translation: `withRawConnection` already translates to an
`ActiveRecordError`, and re-running a PG `_translateException` on an AR error
would fall through its `switch (e.code)` default and re-wrap as
`StatementInvalid`. The fix must translate the raw driver error exactly once
(ordering matters).

## Acceptance criteria

- [ ] `logSql` translates driver errors with `sql` + `binds` (matching Rails
      `AbstractAdapter#log`), so errors thrown from `internalExecQuery` /
      `rawExecQuery` carry statement context on every backend.
- [ ] No double-translation / re-wrap of an already-translated `ActiveRecordError`.
- [ ] The PG `internalExecute` bound-path `_translateException` workaround added
      in PR #4684 is removed (or documented as still required with reasons).
- [ ] Constraint-violation error class + `sql`/`binds` verified on SQLite / PG / MySQL.
