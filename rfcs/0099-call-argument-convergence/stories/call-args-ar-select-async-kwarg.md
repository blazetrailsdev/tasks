---
title: "call-args-ar-select-async-kwarg"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6501
claim: "2026-08-14T01:06:59Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099). Four RFC 0095
call-argument rows on `connection-adapters/abstract-adapter.ts` all drop the
same kwarg — Rails' `async:` on the select family
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:69-102`):

- `select_all` → `Result.empty(async: async)` (:79)
- `select_one` → `select_all(arel, name, binds, async: async)` (:85)
- `select_value` → `select_rows(arel, name, binds, async: async)` (:90)
- `select_rows` → `select_all(arel, name, binds, async: async)` (:102)

They cannot converge until `load_async` lands: `select_all` turns the kwarg
into `FutureResult::SelectAll` (:75), and `Result.empty(async: true)` returns
`EMPTY_ASYNC = FutureResult.wrap(EMPTY)` (`result.rb:247`). trails deliberately
does not port FutureResult / `async_enabled?` / the async executor — see the
note at
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2099-2112`,
which also defers the `AsynchronousQueryInsideTransactionError` guard for the
same reason.

## Acceptance criteria

1. Port `FutureResult` and the `load_async` infrastructure the four call sites
   need (or land this alongside the story that does).
2. `selectAll` / `selectOne` / `selectValue` / `selectRows` take Rails'
   `async:` kwarg with Rails' default and forward it exactly as Rails does,
   including `Result.empty({ async })`.
3. The `AsynchronousQueryInsideTransactionError` guard deferred at
   `database-statements.ts:2099-2112` is wired.
4. The four `connection-adapters/abstract-adapter.ts` `kind: "args"` baseline
   rows are deleted (only-shrink; no `--write`).
