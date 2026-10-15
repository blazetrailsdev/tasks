---
title: "trailmap: hub-backed tests flake when test files share one hub database in parallel"
status: draft
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

While I verified trailmap#70 locally with `HUB_TEST_DATABASE_URL` set to a
freshly migrated scratch database, `pnpm test` failed
`test/controllers/repo-tabs.test.ts` on one run and
`test/models/two-adapters.test.ts` on another. Both passed when run alone, and
on a re-run of the whole suite. The likely cause, which I have not confirmed,
is test files truncating or seeding the one shared hub database in parallel
(`test/support/hub-schema.ts` `truncateHub`).

## Acceptance criteria

- Reproduce the failure by running the full suite repeatedly against one hub database, and name the interleaving.
- Fix it by isolating hub state per test file (a schema per worker, or serialising the hub files), so the full suite passes repeatedly against one hub database.
