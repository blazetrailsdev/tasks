---
title: "exec-query-wrappers-must-not-log"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6325
claim: "2026-08-10T10:02:14Z"
assignee: "uncached-sql-payload-name-nil-passthrough"
blocked-by: null
closed-reason: null
---

## Overlap with `wire-raw-execute-through-log`

Filed before #6311 landed. That PR owns the sibling story
`wire-raw-execute-through-log` and did the `rawExecute` → `log` half plus
`rawExecQuery`; #6325 does the `internalExecQuery` half and closes THIS story.
`wire-raw-execute-through-log` stays open for the piece neither PR did: routing
the concrete adapters' own query paths through `rawExecute` instead of each
calling `log` directly. Do not re-do the wrapper work from this story's Context
below — read it as the record of why, then check `git log` first.

## Context

Surfaced in review of PR #6325 (story
`uncached-sql-payload-name-nil-passthrough`).

Rails' `raw_exec_query` and `internal_exec_query` are pure `cast_result`
wrappers — they do no instrumentation of their own:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:540`
  `def raw_exec_query(...) = cast_result(raw_execute(...))`
- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:546`
  `def internal_exec_query(...) = cast_result(internal_execute(...))`
- `:589` `internal_execute` → `raw_execute`
- `:552-559` `raw_execute` is the sole `log(...)` caller, and
  `abstract_adapter.rb:1134` `log` is the sole payload producer.

trails' mixin defaults instead wrap the call in `logSql`:

- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1358`
  `rawExecQuery` → `logSql(this, sql, name, binds, () => this.rawExecute(...))`
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1384`
  `internalExecQuery` → `logSql(this, sql, name, binds, () => this.internalExecute(...))`

Every real adapter's `rawExecute` / `internalExecute` already calls
`this.log` itself, Rails-style — e.g.
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:756` (`rawExecute`),
`:726` (`internalExecute`), `mysql2-adapter.ts:1145`, `postgresql-adapter.ts:2247`.
So any host that reaches a mixin default on top of a Rails-shaped primitive
emits **two** `sql.active_record` events for one query.

Today the bug is latent, not observed: `rawExecQuery` has no production
caller at all (`git grep rawExecQuery -- packages/activerecord/src` finds only
the definition and its mixin registration), and SQLite3 / PostgreSQL / Mysql2
each `override internalExecQuery`, so the double-logging default never runs on
them. It is a decomposition divergence waiting for the next adapter — and it is
the one place a Rails dev reading `internal_exec_query` would not recognize the
method.

## Acceptance criteria

- [ ] `rawExecQuery` is `castResult(rawExecute(...))` with no `logSql` of its
      own, matching `database_statements.rb:540`.
- [ ] `internalExecQuery` is `castResult(internalExecute(...))` with no `logSql`
      of its own, matching `:546`.
- [ ] The transaction materialization and `Result#length` → `payload.row_count`
      that `logSql` currently performs move to where Rails performs them —
      `raw_execute`'s `with_raw_connection(materialize_transactions:)` and
      `perform_query`'s `notification_payload` writes (`:552-559`).
- [ ] The mixin default's no-`internalExecute` fallback (which routes to
      `this.execute`) either grows the same single-log shape or is removed;
      it must not be a second producer.
- [ ] A test asserts one `sql.active_record` event per query on a host using
      the mixin defaults over a logging `rawExecute`.
