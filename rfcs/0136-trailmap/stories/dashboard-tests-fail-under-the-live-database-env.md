---
title: "Dashboard tests fail when the live TASKS_DATABASE and HUB_DATABASE_URL are exported"
status: draft
updated: 2026-11-18
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

During trailmap#161, `pnpm test` run with the README's "Running it" exports in the shell (`TASKS_DATABASE` pointing at the live `tasks/.git/tasks.db`, and `HUB_DATABASE_URL` at the dev hub) failed 3 tests:

- `test/assets/dashboard-dom.test.ts` › the dashboard palette › closes on a successful spawn and writes its report beside the page's search
- `test/controllers/dashboard-controller.test.ts` › DashboardController › renders the repo options from configuration, sorted by name
- `test/controllers/dashboard-controller.test.ts` › DashboardController › says so rather than offering an empty select when no repos are configured

The same two files pass in a shell without those variables. So the suite reads the developer's live environment rather than only the test one. Anyone who follows the README in one shell, booting the server and then running the tests, gets red tests that have nothing to do with their change.

## Acceptance criteria

- Find which variable leaks into those tests (the repo-options config, or the live tasks DB), and make the suite use only its own test values.
- `pnpm test` passes with the README's exports set.
