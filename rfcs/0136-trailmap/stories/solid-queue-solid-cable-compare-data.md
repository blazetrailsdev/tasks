---
title: "trails: solid-queue and solid-cable have no api or test compare data"
status: ready
updated: 2026-11-06
rfc: "0136-trailmap"
cluster: null
packages: ["scripts", "solid-queue", "solid-cable"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`solid-queue` (56 file-stat rows) and `solid-cable` (4) have a Rails counterpart in `package_meta` (`solid_queue`, `solid_cable`), but at the latest synced commit (pr 9770) neither api:compare nor test:compare writes a row for either. `/packages/solid-queue` and `/packages/solid-cable` therefore show no API or test match.

## Acceptance criteria

- api:compare and test:compare each write a row for `solid-queue` and `solid-cable` (fix in trails' compare configs, with a test there).
- `/packages/solid-queue` shows both tiles once the sync picks the commit up.
