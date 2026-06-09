---
title: "View: adapter-scope the over-broad UpdateableViewTest insert-record skip"
status: ready
updated: 2026-06-09
rfc: "0016-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 15
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced post-merge during #2934. `UpdateableViewTest > insert record`
(`packages/activerecord/src/view.test.ts:247`) is a **global** `it.skip`, but Rails
runs the test on Mysql2/Trilogy/PostgreSQL with no narrower gate
(`view_test.rb:156-190`). The genuine block is MySQL-only: an updatable view
reports its NOT-NULL `id` with default `"0"`, and under session
`NO_AUTO_VALUE_ON_ZERO` a new record's `id` is `0` (not nil), so
`attributesForCreate` keeps it and the INSERT stores a literal 0 instead of letting
the underlying `books` table auto-assign. PostgreSQL's sequence-backed PK assigns
correctly, so the global skip needlessly drops the PG (and Trilogy) coverage Rails
expects. Flagged by Copilot on #2934 (review cycles exhausted there).

Do **not** rename the test (`insert record`) — test:compare matches on the name.

## Acceptance criteria

- Replace the global `it.skip("insert record", …)` with
  `itIfSupports.skipIf(adapterType === "mysql")("views", "insert record", …)` (or
  the equivalent adapter-scoped guard already used by the sibling view tests),
  restoring the Rails-shaped body so PG/Trilogy run it.
- The MySQL-only block is documented inline at the skip site (link the root cause:
  view PK default `"0"` + `NO_AUTO_VALUE_ON_ZERO`).
- CI: the test runs and passes under the PostgreSQL job; remains skipped under
  MySQL. No regression in the other `view.test.ts` cases.
- Out of scope (leave as-is): the two `it.skip` PK-detection cases
  (`does not assume id column as primary key` / `does not have a primary key`,
  `view.test.ts:121`/`:192`), which need view PK introspection.
