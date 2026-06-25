---
title: "Drop emptyInsertStatementValue guard in _insertRecord (Rails unconditional)"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in review of PR #4111 (live-create-path-uses-insert-record). Rails
`_insert_record` (vendored Rails v8.0.2
`activerecord/lib/active_record/persistence.rb:252`) calls
`im.insert(connection.empty_insert_statement_value(primary_key))`
**unconditionally** inside the `values.empty?` branch. The trails port
(`packages/activerecord/src/persistence.ts`, `_insertRecord`) guards the call on
`typeof connection.emptyInsertStatementValue === "function"`. The interface marks
the method optional (`?`), but every real adapter defines it; the guard means a
connection that implements `insert()` without `emptyInsertStatementValue()` falls
through to `connection.insert(im, ...)` with an empty `InsertManager` (no VALUES,
no DEFAULT VALUES clause) and emits malformed SQL — a silent divergence from
Rails' unconditional call.

## Acceptance criteria

- [ ] `_insertRecord` calls `empty_insert_statement_value` unconditionally in the
      empty-values branch (drop the `typeof ... === "function"` guard), matching
      `persistence.rb:252` — OR make `emptyInsertStatementValue` required on the
      connection type that also defines `insert()`.
- [ ] Empty-attribute create (all-default-columns INSERT) still resolves on
      sqlite/postgres/mysql.
- [ ] api:compare and test:compare delta non-negative; lint + typecheck clean.

## Implementation note (already prototyped locally, not merged)

Replace `if (entries.length === 0 && typeof connection.emptyInsertStatementValue === "function")`
with `if (entries.length === 0)` and call
`connection.emptyInsertStatementValue!(!Array.isArray(primaryKey) ? primaryKey : null)`.
