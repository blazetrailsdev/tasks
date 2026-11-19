---
title: "Read the stories and rfcs fixture rows through the fixture accessors"
status: ready
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["autorun-test-context-augments-vitest-runner"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `seed-story-tables-from-fixtures` (trailmap#172), which seeded the shared
`working`, `stuck` and `shipped` stories from `test/fixtures/stories.yml` (and the RFCs from
`test/fixtures/rfcs.yml`, trailmap#159). Every test still reads those rows with
`Story.find("working")` / `Rfc.find("0136-trailmap")`, e.g.
`test/controllers/rfc-pages-controller.test.ts` and `test/controllers/rendered-class-collisions.test.ts`,
because the vitest runner has no fixture accessors yet.

## Acceptance criteria

- Once `autorun-test-context-augments-vitest-runner` lands, the test files read the
  `stories` and `rfcs` fixture rows through the fixture accessors (Rails' `stories(:working)`)
  instead of a `find` by id.
