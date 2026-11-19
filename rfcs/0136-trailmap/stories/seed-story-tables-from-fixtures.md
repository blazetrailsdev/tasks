---
title: "Seed stories, story_deps, story_paths and events from test/fixtures"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 15
pr: trailmap#172
claim: "2026-11-19T02:06:22Z"
assignee: "seed-story-tables-from-fixtures"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `seed-trailmap-tests-from-fixtures` (trailmap#159), which moved the shared
RFCs to `test/fixtures/rfcs.yml` and every task-domain seed into the test transaction.
`stories`, `story_deps`, `story_paths` and `events` got no fixture file: `fixtures :all`
loads every row into every file, and the story rows two files share (`stuck`, `working`,
`shipped`, `s1`/`s2`) would change the counts and lists `ranking`, `backlog-page`,
`rfc-list-page` and `shown-status` assert on.

## Acceptance criteria

- Those four tables get `test/fixtures/<table>.yml` files, and the assertions that count or
  list them are rewritten against the fixture set (an assertion change, decided here
  deliberately), or the story records why a table stays inline.

Reading the rows through the fixture accessors is split out to
`read-story-fixtures-through-accessors`, which waits on
`autorun-test-context-augments-vitest-runner`.

## What stays inline, and why

- `stories` gets `test/fixtures/stories.yml` with the three rows files share: `working`,
  `stuck` and `shipped`.
- `s1`/`s2`, the mutation tests' stories, stay inline. They are `ready`, so as fixtures they
  would join the ready queue in every file, and the claimable, next-bundle and gate tests
  assert that queue row by row. Every mutation test also rewrites them.
- `story_deps`, `story_paths` and `events` get no fixture file. No two files share a row in
  them, and each row exists to make one test's point (a dep that blocks, a path one lookup
  matches, an event one verb counts). A row loaded into every file would only add a term to
  those assertions.
