---
title: "trailmap: the 'no hub schema' boot-refusal test times out under full-suite load"
status: ready
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test/initializers/hub-database.test.ts:77` ("refuses to boot against a
database that has no hub schema") passes alone but intermittently hits
vitest's default timeout during a full `pnpm test` run (seen repeatedly while
working trailmap#91, unrelated to its diff). It boots the initializers against
a fresh Postgres database, so under full-suite load the connect/refuse path
outlives the 5 s default. Distinct from the closed
`hub-backed-tests-flake-when-files-share-one-hub-database`, which was about
shared state, not time.

## Acceptance criteria

- Find what the test waits on (connection attempt, schema probe, pool
  teardown) and bound it, or give this test an explicit timeout with a comment
  saying why that is the right size.
- Ten consecutive full `pnpm test` runs pass with no timeout in this file.
