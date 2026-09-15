---
title: "pg-execute-mutation-through-raw-execute"
status: in-progress
updated: 2026-09-15
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7787
claim: "2026-09-15T13:51:06Z"
assignee: "pg-configure-connection-retire-configured-gate"
blocked-by: null
closed-reason: null
---

## Context

After `wire-raw-execute-through-log`, sqlite3 and mysql2 `executeMutation` both
go through `rawExecute` (`abstract/database-statements.ts`), which mirrors
`raw_execute` → `log` → `with_raw_connection` → `perform_query`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`).

`PostgreSQLAdapter#executeMutation` (`postgresql-adapter.ts`, ~line 895) is the
last adapter write path that still calls `this.log(...)` itself. The reason is
its invented `INSERT ... RETURNING id` fallback: it wraps the attempt in a
driver-level `SAVEPOINT "_bt_ret_N"` (issued with raw `client.query`, so it is
never logged) and retries without `RETURNING` on failure, all inside a single
`log` block. That keeps one `sql.active_record` event per call.
Rails has none of this. `sql_for_insert` appends `RETURNING` only for a real
primary key (`postgresql/database_statements.rb`), so there's nothing to retry.

Routing the attempt and the fallback through `rawExecute` as separate calls would
emit a second event for every failed attempt. That includes habtm join-table
inserts with no `id`, which would break query-count tests. So it needs its own
story.
`support/ddl-profile.ts` wraps PG `executeMutation` separately for this reason.

## Acceptance criteria

- [ ] Remove the `RETURNING id` savepoint/retry fallback from PG `executeMutation`. Build `RETURNING` the way Rails `sql_for_insert` does (primary-key-aware).
- [ ] PG `executeMutation` calls `this.rawExecute(...)` and no longer calls `this.log` directly.
- [ ] Drop the PG-only `executeMutation` wrap in `support/ddl-profile.ts`.
- [ ] A PG insert emits exactly one `sql.active_record`.
