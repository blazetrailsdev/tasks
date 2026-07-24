---
title: "Fix hot_compatibilities cached-plan invalidation flake on PG (shared worker DB)"
status: ready
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Fix hot_compatibilities cached-plan invalidation flake on PG (shared worker DB)

## Context

`packages/activerecord/src/hot-compatibility.test.ts` (Rails:
`HotCompatibilityTest`) creates a **bespoke** table `hot_compatibilities` via
`migration.createTable("hot_compatibilities", { force: true }, ...)` at
`hot-compatibility.test.ts:34` and `:110`, and drops it in `afterEach`
(`:73`, `:92`, `:139`). It is not a leak — `require-table-teardown` is clean —
but under the shared per-worker Postgres DB it intermittently fails:

- Subtest: `HotCompatibilityTest > cleans up after prepared statement failure
in a transaction`.
- PG error `0A000`, `file: 'plancache.c'`, `routine: 'RevalidateCachedQuery'`
  ("cached plan must not change result type"): the test drops/re-adds a column
  on `hot_compatibilities` on one connection while a prepared statement cached
  against the old shape is re-run on another worker connection sharing the DB.
- This is the drift class that `repairWorkerSchema` does **not** cover:
  `repairWorkerSchema` repairs _canonical_ tables, and `hot_compatibilities`
  is bespoke.

Observed on CI run 30060420840, job `Active Record PostgreSQL Tests (2)`
(PR #5205), which was the first PG run with the shared-DB `retry: 2` removed.
This same failure was the reason the previous retry-removal attempt (PR #4136)
was reverted.

Rails source of truth:
`vendor/rails/activerecord/test/cases/hot_compatibility_test.rb` — read it
before changing anything. The trails test mirrors it; the goal is to keep the
Rails-faithful behavior while making the bespoke table safe under a shared
worker DB (e.g. correct connection/plan-cache isolation, or make the DDL and
the re-execution use the same physical connection as Rails does), **without**
weakening or skipping the assertions.

## Acceptance criteria

- `hot-compatibility.test.ts` passes deterministically on PG with `retry: 0`
  (no shared-DB `0A000` cached-plan failure), across repeated runs.
- No assertion weakened, no subtest skipped, test names unchanged (they match
  Rails verbatim).
- MariaDB and SQLite lanes stay green.
- Blocks story `remove-pg-mysql-test-retry-after-flake-burndown` (RFC 0028):
  the retry cannot come off PG until this is closed.
