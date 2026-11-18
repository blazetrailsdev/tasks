---
title: "Seed stories, story_deps, story_paths and events from test/fixtures"
status: draft
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
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
- Files read the rows through the fixture accessors once `autorun-test-context-augments-vitest-runner` lands.
