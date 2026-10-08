---
title: "trailmap: the live-database tests are skipped in CI, and three fail when TASKS_DATABASE is set"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four tests are skipped unless `TASKS_DATABASE` is set, and CI's `test` job does
not set it, so they never run there. Found while fixing trailmap#46 by running
`pnpm test` with the gate's environment still exported
(`TASKS_DATABASE=<tasks checkout>/.git/tasks.db`): three of the four fail on
`main` at b685906, in files that PR did not touch. Not investigated further
than the assertion output below.

- `test/initializers/tasks-database.test.ts:69` — "opens the live database
  under the write protocol": `expected '[object Promise]' to be 'wal'`. The
  line is `String((await Base.leaseConnection()).selectValue("PRAGMA
journal_mode"))`: `selectValue` returns a promise and the test stringifies it
  without awaiting.
- `test/models/tasks-database-config.test.ts` — "describes a single-connection
  pool to the file TASKS_DATABASE names": the config now also carries
  `pragmas: { journal_mode: "WAL" }` and `timeout: 5000`; the test's expected
  object still has only `adapter`, `database`, `pool`.
- `test/models/tasks-database.test.ts:26` — "reads RFCs the CLI wrote":
  asserts RFC `0136-trailmap` has status `active`; in the live database it is
  `draft`. The test pins a fact about live data that is free to change.

The shape of the problem is that a test nothing runs keeps passing review
while the code under it moves. Each of the three went stale silently.

## Acceptance criteria

- `TASKS_DATABASE=<tasks checkout>/.git/tasks.db pnpm test` passes: all three
  tests fixed, each for its own cause (await the pragma read; expect the
  config the write protocol actually produces; assert something about the live
  RFC row that does not depend on its current status).
- These tests run somewhere on every PR. The `gate` job already ingests a
  tasks database at `tmp/ci-tasks.db`; running the env-gated tests against it
  there is one way. If that is rejected, say why in the PR.
- If the first failure turns out to be `selectValue` changing from sync to
  async under a vendor bump without the typecheck catching it, file that
  against trails rather than only fixing the test.
