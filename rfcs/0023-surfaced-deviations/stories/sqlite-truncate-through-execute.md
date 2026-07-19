---
title: "Drop the SQLite truncate override — its read-only-execute rationale is false"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `truncate` is `execute(build_truncate_statement(table_name), name)`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:218-220`).

trails overrides it on SQLite to call `executeMutation` instead
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1305-1312`),
and the abstract path carries a matching caveat
(`connection-adapters/abstract/database-statements.ts:714-720`).

The stated rationale is wrong. Both files claim SQLite's `execute` is "a
read-only `.all()` cursor" that "rejects" a `DELETE FROM`. PR #4962 established
that is false: `execute` and `executeMutation` share one `_performQuery`, and
the `.run()`-vs-`.all()` choice is made _inside_ `perform_query` by
`isWriteQuery` — not by the entry point
(`connection-adapters/sqlite3/database-statements.ts:205-228`). `isWriteQuery`
classifies DELETE as a write, so `execute` already takes `.run()`.

The override is therefore unnecessary machinery justified by a stale comment,
and it is the last DDL/DML site in the adapters still bypassing the wired
`execute` after #4962.

## Acceptance criteria

- [ ] Delete the `truncate` override in `sqlite3-adapter.ts` so SQLite uses the
      abstract `execute` path, matching Rails' one-line `truncate`.
- [ ] Remove the stale "read-only `.all()` cursor" caveat from
      `abstract/database-statements.ts` (and the override's JSDoc).
- [ ] Confirm truncate still dirties the query cache: it now clears via the
      wired `execute` rather than the (unwired since #4962) `executeMutation`.
- [ ] Existing truncate tests stay green on all three adapters.
