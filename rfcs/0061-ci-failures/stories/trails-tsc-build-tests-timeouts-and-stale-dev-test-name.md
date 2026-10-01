---
title: "trails-tsc: two-build tests need explicit timeouts; dev test name is stale"
status: draft
updated: 2026-10-01
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8339 made `buildViews` async (`packages/trails-tsc/src/build-views.ts`).
Two loose ends in its tests, both TS-only tooling with no Rails counterpart:

- `packages/trails-tsc/src/build-views.test.ts` — "clears stale outputs from a
  prior build" and "deletes a views-manifest.ts left behind by an older build"
  each run two builds and take ~2.6-2.9 s on a loaded host (same on main), so
  they sit close to vitest's 5 s default; each timed out once locally at load
  average ~20. The later tests in the file already pass `30_000`.
- The test named `` `dev` starts the watcher synchronously and runs an initial
build `` now awaits `runCli(["dev", …])`; the name describes the old sync
  behaviour.

## Acceptance criteria

- The two-build tests carry an explicit timeout like their neighbours.
- The `dev` test's name says what it asserts now.
