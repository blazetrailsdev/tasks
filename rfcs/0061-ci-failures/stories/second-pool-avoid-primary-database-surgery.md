---
title: "Stop setupSecondPool from mutating the shared primary database"
status: done
updated: 2026-07-27
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5438
claim: "2026-07-27T18:47:51Z"
assignee: "second-pool-avoid-primary-database-surgery"
blocked-by: null
closed-reason: null
---

## Context

`setupSecondPool` (`packages/activerecord/src/test-helpers/setup-second-pool.ts:43`)
mirrors Rails' `arunit`/`arunit2` split by _mutating the shared primary
database_: it drops `courses`, `colleges`, `professors`, `courses_professors`
so the primary pool faithfully lacks the arunit2-only tables, and rebuilds
`entrants`. Rails has no such step — its two databases are genuinely separate
and per-process. Because our primary database is shared with every sibling
suite in the vitest worker, PR #5255 had to bolt on a `teardownSecondPool()`
that puts the four tables (plus `entrants`) back in an `afterAll` in each of
the three calling suites (`multiple-db.test.ts`,
`prepared-statement-status.test.ts`,
`associations/has-and-belongs-to-many-associations.test.ts`).

That works, but the setup/teardown pair is a trails invention and is fragile:
a fourth caller that forgets the `afterAll` reintroduces the schema drift that
RFC 0070's repair worker exists to paper over.

## Acceptance criteria

- Either give the second-pool suites their own primary database/connection
  (so no surgery on the shared one is needed), or fold the restore into the
  helper itself so callers cannot forget it (e.g. a scoped
  `withSecondPool(fn)` that always restores).
- The three current callers drop their hand-written `afterAll`.
- No test renamed; sqlite gating unchanged; `parity:test` delta >= 0.
