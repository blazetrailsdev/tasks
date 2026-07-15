---
title: "converge-vestigial-sqlite3-perform-query"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - unify-execute-mutation-into-perform-query
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`
exports a `performQuery` (line 161), `castResult` (211) and `affectedRows` (217)
that port
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:78`.

`performQuery` there has NO callers. It is written against better-sqlite3's
native synchronous API — it takes a raw connection, calls
`rawConnection.prepare(sql)` directly, spreads binds (`stmt.run(...binds)`) and
returns synchronously. The sqlite3 adapter does not talk to better-sqlite3
natively: it goes through the async `SqliteStatement` / `SqliteConnection`
driver abstraction in `sqlite-adapter.ts` (array binds, promise-returning,
multi-driver — better-sqlite3, node-sqlite, libsql, expo). So the ported
function cannot be called from the adapter as-is.

PR 4893 unified the adapter's `execute` / `executeMutation` onto one live
primitive, but had to implement it as `_performQuery` inside `sqlite3-adapter.ts`
because it needs `_cachedStatement` (the statement pool) and
`_maybeEnableReadBigInts`. That leaves two implementations of the same Rails
method: a live private one on the adapter and a dead public one in the
Rails-layout file. api:compare's coverage points at the dead one.

Same shape as the note in
`project_raw_execute_only_works_on_pg_no_log_helper`: `rawExecute` is likewise
vestigial, with `performQuery` wired on PG alone. Worth sequencing with
`converge-execute-batch-through-raw-execute`, which touches the same layer.

## Acceptance criteria

- [ ] Decide and record which of the two is the real port: either rewrite
      `sqlite3/database-statements.ts`'s `performQuery` against the async driver
      abstraction so the adapter can delegate to it, or remove it and move the
      live implementation into the Rails-layout file. Do NOT leave two.
- [ ] The surviving `performQuery` is reachable from
      `AbstractSQLite3Adapter.execute` / `executeMutation` and keeps the
      statement pool (`_cachedStatement`) and `_maybeEnableReadBigInts`
      behavior.
- [ ] Keep the `stmt.reader` branch and the separate affected-rows read,
      including the `INSERT ... RETURNING` case, which reports `reader === true`
      and so takes the rows branch — PR 4893's covering test must stay green.
- [ ] Verify with `pnpm api:compare` that sqlite3 `perform_query` coverage
      points at live code. Run the ratchet lints too (`api:calls`,
      `api:calls:wide`, `api:pins`) — `api:compare` alone does not run them.

## Notes

Rebuilding the api-compare manifest arms a member-reorder autofix via the
gitignored `eslint/rails-file-structure-method-order.json`; delete it before
committing, and check `git status` for tracked manifests that the run dirtied.

Hard rules: no `node:*` imports. No `process.*` references. Async fs only.
No new third-party runtime deps. 500 LOC ceiling. NO STACKED PRs — single PR
from main. Test names match Rails verbatim.
