---
title: "copy_table family reaches past execute/internal_exec_query to driver.exec"
status: draft
updated: 2026-07-28
rfc: "0076-execute-primitive-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), a
private helper that calls `this.driver.exec` and wraps failures in
`_translateException`. It was introduced in #5527 because the previous
bare `driver.exec` calls surfaced raw `SqliteError`s instead of
`StatementInvalid` (caught by
`CompositeForeignKeyTest > add composite foreign key raises without options`).

Error translation is therefore correct now, but the rest of the `execute`
contract is still bypassed:

- no `sql.active_record` notification, so `assertQueries`-style counting
  and any subscriber see none of the rebuild's statements;
- no query-cache dirtying — `alterTable` compensates with an explicit
  `clearQueryCache()` at the end, with a comment saying exactly that;
- no statement logging.

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
      `driver.exec`, or the deviation is documented at the call site with
      the reason converging is not viable.
- [ ] Rebuild statements are visible to notifications/logging on the same
      terms as Rails'.
- [ ] If the primitives dirty the query cache, `alterTable`'s compensating
      `clearQueryCache()` and its explanatory comment go away.
- [ ] Savepoint nesting still holds for an `alterTable` called inside an
      open transaction (migrations).
- [ ] Green on all three adapters, in particular `adapters/sqlite3/`,
      `sqlite3-copy-table.test.ts`, `migration/foreign-key.test.ts`,
      `query-cache-ddl-dirties.trails.test.ts`.
