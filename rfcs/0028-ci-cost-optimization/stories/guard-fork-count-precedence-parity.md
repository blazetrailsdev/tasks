---
title: "Guard the duplicated fork-count precedence between vitest.config.ts and ar-db-slots.ts"
status: done
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5253
claim: "2026-07-24T18:54:54Z"
assignee: "guard-fork-count-precedence-parity"
blocked-by: null
closed-reason: null
---

## Context

PR #5243 moved the fork-count clamp into
`packages/activerecord/src/test-helpers/ar-db-slots.ts:workerForkCount()` (via
the new `OsAdapter.availableParallelism()`), but `vitest.config.ts` still
computes the same value independently for `poolOptions.forks.maxForks`:

- `vitest.config.ts:90` — `TRAILS_TEST_FORKS ?? AR_DB_FORKS`, default
  `DEFAULT_FORKS`, then `Math.max(os.availableParallelism() - 1, 1)`.
- `ar-db-slots.ts:69` / `hostForkCap()` — the same precedence and formula.

The duplication is forced: `vitest.config.ts` is loaded before any workspace
package is built, so it cannot import `@blazetrails/activesupport` (that is why
`DEFAULT_FORKS` was split into the dependency-free `ar-db-forks-default.ts`).
Nothing enforces that the two stay identical. The first review round on #5243
caught exactly this class of drift: dropping the `process.env.AR_DB_FORKS`
republish silently cut `TRAILS_TEST_FORKS` out of `workerForkCount()`, so the
slot pool would have been sized against a worker count vitest never spawned,
and `TRAILS_TEST_FORKS=1` solo runs would have missed the single-worker
advisory-lock bypass in `test-setup-worker-db.ts:78,113`. It was caught by
review, not by a test.

## Acceptance criteria

- [ ] A test asserts that `vitest.config.ts`'s effective fork count and
      `workerForkCount()` agree across the precedence matrix
      (`TRAILS_TEST_FORKS` set / `AR_DB_FORKS` set / both / neither) and under
      a pinned host core count — e.g. by exporting the config's computation as
      a named helper the test can call, or by asserting the resolved
      `maxForks` against `workerForkCount()`.
- [ ] The helper stays free of `@blazetrails/activesupport` imports so
      `vitest.config.ts` still loads before the workspace is built.
- [ ] The test fails if either side's precedence order or host clamp is
      changed in isolation.
