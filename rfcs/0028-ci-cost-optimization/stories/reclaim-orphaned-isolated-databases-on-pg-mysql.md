---
title: "Reclaim orphaned isolated PG/MySQL databases when a worker dies before teardown"
status: ready
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5531 added `packages/activerecord/src/support/isolated-database.ts`:
`openIsolatedDatabase(label)` opens a private database per lane and worker
slot. On sqlite the database is a scratch file from `scratchDatabasePath`
(`support/scratch-database.ts`), which registers best-effort unlink-on-exit via
`registerDbFileCleanupOnExit` and also unlinks a stale file on first use — so a
run killed mid-suite leaves nothing behind that can poison the next run.

The PG and MySQL branches have neither half. They rely solely on the handle's
`close()` (called from the owning file's `afterAll`) to `dropDatabase`. A vitest
worker killed before `afterAll` runs — timeout, OOM, CI cancel — leaves
`<primary>_<label>` on the server for the rest of the run and beyond. The open
path calls `recreateDatabase`, so a stale database is dropped the next time the
same slot opens the same label, but a label that is never reopened (or a slot
that never runs the file again) leaks indefinitely.

## Acceptance criteria

- A PG/MySQL isolated database is reclaimed even when the owning worker dies
  before `close()` runs — either by a run-scoped sweep of the derived name
  prefix or by an equivalent exit hook, mirroring what
  `registerDbFileCleanupOnExit` gives the sqlite branch.
- The sweep is scoped to names this helper derives (the `<primary>_<label>`
  shape) so it can never touch the primary, `arunit`, or `arunit2` databases of
  a sibling worker running in parallel.
- Covered by a test on the PG and MySQL lanes.
