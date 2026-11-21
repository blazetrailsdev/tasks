---
title: "sqlite-happy-path-typecheck-e2e-times-out-at-default-5s"
status: done
updated: 2026-11-21
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10462
claim: "2026-11-21T00:28:17Z"
assignee: "sqlite-happy-path-typecheck-e2e-times-out-at-default-5s"
blocked-by: null
closed-reason: null
---

# sqlite-happy-path "new → typecheck" times out at vitest's 5s default under CI load

## Context

`packages/activerecord-cli/test/__e2e__/sqlite-happy-path.test.ts:154`, "new → typecheck runs trails-tsc in the generated project", runs `ar new`, symlinks packages and runs trails-tsc. It has no per-test timeout, so it gets vitest's 5000ms default.

- On main (run 44830710947) it took 2.2–2.8s across the SQLite, PostgreSQL and MariaDB lanes.
- On trails#10452 (run 44832534743) it timed out at about 6.6s in both the SQLite (1) and MariaDB (1) jobs: `Error: Test timed out in 5000ms.`
- Locally, main's `trails-tsc/lib/build-views.ts` and #10452's give the same time, about 2.7s. The generated project does not install actionpack, so the PR's diff cannot reach it.

The test is a cold tsc compile with roughly 2x headroom, so a busy runner pushes it past the default.

## Acceptance criteria

- The e2e typecheck tests in `sqlite-happy-path.test.ts` (and sibling `__e2e__` files that run trails-tsc) carry an explicit timeout sized for a cold compile on a loaded runner, or the `__e2e__` project sets a `testTimeout`.
- `pnpm vitest run packages/activerecord-cli/test/__e2e__/sqlite-happy-path.test.ts` stays green.
