---
title: "trailmap: message, spawn and broadcast actions in the palette"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-search
packages: [actionview]
deps: [fleet-palette-search, fleet-session-composer]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fleet-palette-search` opens the palette with results only. The broadcast
card and `#spawnPanel` (`app/views/dashboard/index.html.tse`) are still
forms. The RFC's "Search" moves them into palette actions.

## Acceptance criteria

- [ ] The palette offers "Message <session>" (⌘↵ on a session result),
      "Spawn" and "Broadcast", each using the existing control requests.
- [ ] The header Broadcast and Spawn buttons open the palette on those
      actions, and the broadcast and spawn forms leave the page in the same
      PR.
- [ ] Every option the forms had (repo, audience, the CI-red broadcast)
      stays reachable.

## Verification

- `./scripts/dashboard-e2e.sh` (the CI `dashboard-e2e` job) runs each action once and asserts its control request.
