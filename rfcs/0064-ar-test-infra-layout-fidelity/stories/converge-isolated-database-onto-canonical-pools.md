---
title: "converge-isolated-database-onto-canonical-pools"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5599
claim: "2026-07-29T19:46:34Z"
assignee: "converge-isolated-database-onto-canonical-pools"
blocked-by: null
closed-reason: null
---

## Context

`support/scratch-database.ts` is a trails invention: Rails' AR suite has exactly
two databases, `arunit` and `arunit2` (`vendor/rails/activerecord/test/config.example.yml:83-91`),
both fixed files reused across runs, and a test needing a second database rides
`ARUnit2Model`'s pool.

The two _test_ callers have been converged onto the canonical pair (see the PR
that closes `sweep-temp-sqlite-dbs-on-non-sqlite-lanes`):

- `multi-db-migrator.test.ts` now takes `Base.leaseConnection()` /
  `ARUnit2Model.leaseConnection()`, mirroring
  `multi_db_migrator_test.rb:22-23`.
- `associations.test.ts` now uses the canonical `OtherDog < ARUnit2Model`
  (`vendor/rails/activerecord/test/models/other_dog.rb`), whose arunit2 `dogs`
  table `setup-second-pool.ts` already lays per `schema.rb:1462`.

The one remaining caller is `support/isolated-database.ts` (used only by
`support/drop-all-tables.test.ts`). Its rationale is a real harness constraint
with no Rails counterpart: Rails runs a database-wiping suite in its own process
against its own `arunit`, whereas trails shares one database per vitest worker
across every file it runs, so a suite asserting a zero-table end state would take
the canonical schema down with it.

## Acceptance criteria

- `drop-all-tables.test.ts` rides a canonical pool (or the constraint is
  re-solved without a per-file throwaway database — e.g. asserting over a
  connection whose teardown restores the canonical tables, the way
  `setup-second-pool.ts`'s `teardownSecondPool` already does).
- `support/scratch-database.ts` and `support/isolated-database.ts` are deleted,
  along with `scratch-database.test.ts`.
- With them gone, confirm whether any `ar-test-*` temp sqlite files are still
  minted on a non-sqlite lane. `support/connection.ts`'s `fallbackDatabasePath`
  is the other producer and is itself Rails-less (Rails' sqlite `arunit` is a
  configured file, never a per-process temp path); if it survives, register its
  convergence separately rather than reviving the lane-wide sweep that PR #5590
  proposed.

## Notes

PR #5590 (closed unmerged) would have made the temp-file sweep run on every
adapter lane. It was closed because it hardened the deviation instead of
removing it. Do not resurrect it as a substitute for this convergence.
