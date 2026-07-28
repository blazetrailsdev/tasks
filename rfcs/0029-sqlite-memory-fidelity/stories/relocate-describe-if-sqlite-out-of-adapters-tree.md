---
title: "Relocate describeIfSqlite so connection-adapters tests stop importing across trees"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5536
claim: "2026-07-28T21:45:44Z"
assignee: "relocate-describe-if-sqlite-out-of-adapters-tree"
blocked-by: null
closed-reason: null
---

## Context

Introduced by #5500 (story `sqlite3-connection-adapter-tests-ambient`, RFC 0029).

`describeIfSqlite` lives in `packages/activerecord/src/adapters/sqlite3/test-helper.ts`,
whose own docstring scopes it explicitly:

> Shared helpers for `adapters/sqlite3/*.test.ts`. Keep this file tiny —
> anything beyond cross-test glue belongs in the source tree, not here.

PR 5500 needed the same SQLite-lane gate for three files in the _pre-RFC-0026_
`connection-adapters/` tree, and imported it across trees rather than
duplicating it:

- `connection-adapters/sqlite3-copy-table.test.ts`
- `connection-adapters/sqlite3-adapter.query-transformers.test.ts`
- `connection-adapters/sqlite3/quoting.test.ts`

Importing was the right call over duplicating the predicate (the helper exists
so "what counts as a SQLite run" has one source of truth, backed by
`isSqliteRun` in `support/sqlite-template.ts`), but it leaves the helper's
stated contract false and couples two test trees that RFC 0026 is separating.

The clean resolution is probably to move the gate down to `support/` next to
`isSqliteRun` — where `describeIfPg` / `describeIfMysql` would also belong — and
have both trees import from there. Worth confirming against RFC 0026's intended
end-state for `connection-adapters/` first: if those three files are slated to
move or be deleted, this resolves itself and the story should be closed as
superseded.

## Acceptance criteria

- [ ] Either relocate `describeIfSqlite` to a tree-neutral module (alongside
      `isSqliteRun`) and repoint both trees, or confirm the
      `connection-adapters/` files are going away under RFC 0026 and close this
      as superseded.
- [ ] `adapters/sqlite3/test-helper.ts`'s docstring matches reality either way.
- [ ] One source of truth for the SQLite-lane predicate is preserved — no
      duplicated gate.
- [ ] Test names unchanged.
