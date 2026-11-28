---
title: "Campfire example: system, integration and middleware tests, and a two-session system test"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, actionpack]
deps:
  [
    campfire-channels,
    campfire-views,
    campfire-javascript-controllers,
    campfire-javascript-lib-and-models,
    campfire-stylesheets-a-to-l,
    campfire-stylesheets-m-to-z-and-images,
    campfire-jobs-web-push-and-wal-checkpoint,
    campfire-controllers-namespaced,
  ]
deps-rfc: []
est-loc: 1300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Verification. `test/system/` (833 lines), `test/integration/` (197),
`test/middleware/` (42), `test/performance/` and `test/script/` (29). System
tests run on Vitest and Playwright (trails CLAUDE.md, "System testing runs on
Vitest").

## Acceptance criteria

- [ ] every listed test file ported and passing
- [ ] one added system test: two sessions in one room see each other's messages, presence and typing indicator, and removing one member from the room closes their socket
