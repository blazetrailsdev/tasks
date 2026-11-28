---
title: "Campfire example: remaining tests and a two-session system test"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: []
deps:
  [
    campfire-channels,
    campfire-controllers-views-helpers,
    campfire-jobs-and-web-push,
    campfire-javascript,
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Verification. Campfire ships 107 Ruby test files (9,206 lines). Stories
above port the tests for their own files; this one ports what is left,
including system tests, on Vitest and Playwright.

## Acceptance criteria

- [ ] every remaining Campfire test ported and passing on SQLite
- [ ] a system test with two sessions in one room covering messages, presence, typing and a member removal
