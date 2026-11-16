---
title: "The command palette's footer hints follow its mode"
status: draft
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The command palette's footer is one fixed line of key hints:
`app/views/dashboard/index.html.tse:130` (and the same line in
`rails/app/views/dashboard/index.html.erb`) always says "move", "open",
"message session", "close". In the spawn, broadcast and message modes there is
no list to move through or open, and Enter sends, so the hints are wrong there
(see the spawn and broadcast screenshots on trailmap#145).

## Acceptance criteria

- The footer shows the hints for the current mode: search keeps today's;
  spawn says Enter spawns; broadcast says Enter sends to all and the modifier
  sends to the CI-red ones; message says Enter sends.
- Both apps render the same markup, and `scripts/dashboard-e2e.ts` asserts the
  footer text changes with the mode.
