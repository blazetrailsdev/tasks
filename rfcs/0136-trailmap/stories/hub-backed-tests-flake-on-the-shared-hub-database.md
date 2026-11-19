---
title: "Hub-backed tests and the dashboard palette DOM test flake when the suite runs with Postgres"
status: in-progress
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

Measured during trailmap#155, 2026-11-17, with `HUB_DATABASE_URL` and
`HUB_TEST_DATABASE_URL` pointing at one Postgres 18 database (CI's shape):

- `main` at f69d073: one of two full runs failed 4 tests, in
  `backlog-page`, `rfc-list-page`, `sessions-controller` and
  `story-pages-controller`. The other run was green.
- #155's branch: one failure in five runs in `dashboard-controller` ("says so
  rather than offering an empty select when no repos are configured" found
  repositories), and `test/assets/dashboard-dom.test.ts` ("closes on a
  successful spawn and writes its report beside the page's search") failed
  twice in about eight runs, once without Postgres.

The hub tests share ONE hub test database across vitest workers and take turns
through an advisory lock (`test/support/hub-schema.ts`). A file that reads hub
rows without taking the lock (the dashboard reads `Repository`) can see another
file's rows mid-turn. The `dashboard-dom` failure is a jsdom timing assertion.

## Acceptance criteria

- Each failing case is reproduced (loop the file, or run the suite with
  `--sequence.shuffle`) and its cause named.
- Files that read hub rows either take the hub lock or get a database of their
  own, so no hub-backed case depends on what another file wrote.
- `dashboard-dom`'s spawn case waits for the condition it asserts instead of a
  fixed turn.
- Ten consecutive full runs in CI's Postgres shape pass.
