---
title: "tasks CLI: add a TASKS_DIR test seam so the read path is testable without a real checkout"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

`TASKS_DIR` is a module-level `const` initialized from `resolveTasksDir()` at
import time (`scripts/tasks/cli.ts:63`), so a test cannot point the CLI at a
fixture checkout — by the time a test runs, the value is frozen. The lock has
a seam for exactly this reason (`__setLockDirForTest`, `cli.ts:791`), but the
index/working-tree paths do not.

The cost showed up in PR #5432. The regression test for the offline read
fallback (`degrades to the working-tree index with a staleness warning when
origin is unreachable`, `cli.test.ts`) cannot assert the returned index at
all: `readIndexSource()` hands off to the real `TASKS_DIR` checkout, which
exists on a dev machine and does not on a CI runner. The test wraps the call
in try/catch and asserts only the warning plus "no `reset`", and an earlier
attempt to assert `not.toContain("status")` failed CI for the same reason —
the assertion silently depended on whether the runner's checkout had an
`index.json`. Two CI failures on that PR traced to this single missing seam.

A `__setTasksDirForTest`-style seam (or routing the handful of `TASKS_DIR`
readers on the read path through a resolver) would let the fallback be tested
against a fixture dir: assert `sha: null`, the served index contents, that no
rebuild spawns when `index.json` is present, and that the no-index rebuild
branch restores `index.md` only when it was clean.

## Acceptance criteria

- Read-path `TASKS_DIR` consumers resolve through a seam a test can set,
  mirroring `__setLockDirForTest`'s shape.
- The offline-fallback regression test drops its try/catch and asserts the
  served index and `sha: null` directly against a fixture checkout.
- The `loadIndexWithoutDirtyingTree()` no-index branch gains direct coverage:
  `index.md` restored when our rebuild dirtied it, left alone when it was
  already dirty.
- Tests pass with and without a real tasks checkout present.
