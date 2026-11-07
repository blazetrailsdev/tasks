---
title: "trailmap: /packages/actionpack shows its api and test compare numbers"
status: ready
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/packages/actionpack` has file stats and marks, but its API and Tests tiles are empty. In `stats-job.db`, at the latest synced commit (pr 9770), api:compare and test:compare write actionpack's rows under its four Rails keys: `actiondispatch`, `actioncontroller`, `abstractcontroller` and `actionpackversion`. trails maps those keys in `scripts/api-compare/config.ts:42-45`. The packages pages look up `package = 'actionpack'` (`latestRatios` and `show` in `app/controllers/packages-controller.ts`, and the Rails twin), so they find nothing. The index row and the overview tiles have no numbers either.

## Acceptance criteria

- `/packages` and `/packages/actionpack` show actionpack's API and test match, summed (matched and total) across the keys that map to the `actionpack` package directory, in both apps.
- The key-to-package mapping lives in one place: either the sync stores it, or the package-summary artifact carries it. It must not be a hard-coded list in a controller.
- A test on each side seeds rows under two of the keys and asserts the summed tile.
- `script/tandem /packages /packages/actionpack` reports SAME against `stats-job.db`.
