---
title: "copy_table family reaches past execute/internal_exec_query to driver.exec"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6301
claim: "2026-08-09T20:49:23Z"
assignee: "retire-quoting-dispatch-helpers-onto-self-send"
blocked-by: null
closed-reason: null
---

## Context

Rails' copy-table family runs its statements through the logged,
notification-emitting primitives: `create_table` / `drop_table` /
`add_index` reach `execute`, and `copy_table_contents` uses
`internal_exec_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:593-648`).

trails routes all of them through `execCopyTable`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2447`,
called from `:2466`, `:2601`, `:2621`), a private helper that calls
`this.driver.exec` and wraps failures in `_translateException`. It was
introduced in #5527 because the previous bare `driver.exec` calls surfaced raw
`SqliteError`s instead of `StatementInvalid`.

**Re-verified against origin/main 2026-08-09 — partially converged.**
`execCopyTable` now builds a payload via `_notificationPayload` and wraps the
`driver.exec` in `Notifications.instrumentAsync("sql.active_record", ...)`
(sqlite3-adapter.ts:2448-2455), so the rebuild's statements ARE visible to
subscribers / `assertQueries` now. What is still bypassed:

- no query-cache dirtying — `alterTable` still compensates with an explicit
  `clearQueryCache()` (sqlite3-adapter.ts:2353);
- the statements still do not go through `execute` /
  `internal_exec_query`, so the payload is hand-rolled here rather than
  produced by the shared primitive (same defect class as
  `converge-payload-producers-onto-adapter-log`).

The reason it goes direct is savepoint nesting: `alterTable` manages its
own `beginTransaction`/`commit` or `createSavepoint`/`releaseSavepoint`
around the rebuild, and routing through the higher-level primitives
risked re-entering that machinery. Converging means establishing which
primitive is safe inside that boundary rather than reaching past all of
them.

Related: `converge-internal-exec-query-through-perform-query` (0076) and
`schema-query-converge-to-internal-exec-query` (0076) are the same theme
one layer down.

## Acceptance criteria

- [ ] The copy-table family's DDL and INSERT go through the adapter's
      `execute` / `internal_exec_query` primitives rather than
      `driver.exec` + a hand-rolled payload, or the deviation is documented at
      the call site with the reason converging is not viable.
- [ ] `alterTable`'s compensating `clearQueryCache()` (sqlite3-adapter.ts:2353)
      and its explanatory comment go away once the primitives dirty the cache.
- [ ] Savepoint nesting still holds for an `alterTable` called inside an
      open transaction (migrations).
- [ ] Green on all three adapters, in particular `adapters/sqlite3/`,
      `sqlite3-copy-table.test.ts`, `migration/foreign-key.test.ts`,
      `query-cache-ddl-dirties.trails.test.ts`.
