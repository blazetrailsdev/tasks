---
title: "Replace hand-rolled tableNames shape reader in canonical-schema.test.ts with Result#pluck/toArray"
status: ready
updated: 2026-07-05
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tableNames` in `packages/activerecord/src/test-helpers/canonical-schema.test.ts:100`
still hand-rolls a shape-tolerant reader over the raw selectAll return
(`Array.isArray(res) ? ... : { columns, rows }` + `columns.indexOf("name")`).
This is the same dead-branch / duplicated column-index logic the reviewer
flagged for `dumpSchema` on PR #4565 — `selectAll` is declared
`Promise<Result>` (abstract-adapter.ts:374; base throws unless overridden, no
adapter returns a bare array), and `Result` (result.ts:88) already exposes
`toArray()` and `pluck()` which do the positional-array → value mapping.

PR #4565 fixed only `dumpSchema` (its story scope). This helper — introduced by
PR 4551 — should get the same treatment for consistency and to drop the
never-taken `Array.isArray` branch.

## Acceptance criteria

- `tableNames` reads names via `Result#pluck("name")` (or `toArray()`), with no
  `Array.isArray` branch and no manual `columns.indexOf`.
- The three `ensureCanonicalTables` tests that use it still pass unchanged.
- No test renames; `test:compare` delta >= 0.
