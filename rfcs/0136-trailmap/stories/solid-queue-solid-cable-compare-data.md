---
title: "trails: solid-queue and solid-cable have no api or test compare data"
status: blocked
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: ["scripts", "solid-queue", "solid-cable"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#127
claim: "2026-11-07T04:46:56Z"
assignee: "api-compare-gem-ports-without-api-rows"
blocked-by: "trailmap#127 merged and deployed 2026-11-07 11:56Z; verify both tiles on /packages/solid-queue after the next nightly sync (last was 08:00, pre-deploy)"
closed-reason: null
---

## Context

`solid-queue` (56 file-stat rows) and `solid-cable` (4) have a Rails counterpart in `package_meta` (`solid_queue`, `solid_cable`), but at the latest synced commit (pr 9770) neither api:compare nor test:compare writes a row for either. `/packages/solid-queue` and `/packages/solid-cable` therefore show no API or test match.

## Acceptance criteria

- api:compare and test:compare each write a row for `solid-queue` and `solid-cable` (fix in trails' compare configs, with a test there).
- `/packages/solid-queue` shows both tiles once the sync picks the commit up.
