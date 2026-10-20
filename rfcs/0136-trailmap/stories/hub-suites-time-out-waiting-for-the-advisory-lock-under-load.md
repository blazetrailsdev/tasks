---
title: "trailmap: the hub suites time out in beforeAll waiting for the advisory lock on a loaded machine"
status: done
updated: 2026-10-20
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#71
claim: "2026-10-20T14:01:25Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

## Context

Seen repeatedly while verifying trailmap#64. The hub-backed suites
(`test/models/two-adapters.test.ts`, `test/controllers/repo-tabs.test.ts`,
and the others that call `connectHubTestDatabase`) serialize on a
session-scoped Postgres advisory lock (`test/support/hub-schema.ts`). Each
waits for the lock inside `beforeAll`, under vitest's default 10s hook
timeout. On a loaded machine (load average above 50, other agents running)
the wait alone exceeds it: "Hook timed out in 10000ms", in a different file
each run. The same files pass alone, and passed in CI every time.

`test/lib/ringo-core.test.ts`'s multi-megabyte replay hit its 5s test timeout
in the same runs, for the same reason.

## Acceptance criteria

- [ ] The hub suites' setup hook has a timeout sized for waiting on the lock
      behind every other hub file, not vitest's default — or the files stop
      contending (one hub project run in a single worker).
- [ ] The multi-megabyte replay test has a stated budget rather than the
      default.
- [ ] A full `pnpm test` with `HUB_TEST_DATABASE_URL` set passes on a loaded
      machine.
