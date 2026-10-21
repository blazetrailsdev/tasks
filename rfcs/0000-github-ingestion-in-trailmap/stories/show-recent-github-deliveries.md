---
title: "trailmap: a deliveries page with repo × event counts for the shadow check"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [actionview]
deps: [receive-and-store-github-deliveries]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Before cutover, someone has to see that trailmap receives what ringo's hooks
receive. GUIDs differ between the two hooks, so the comparison is by count.

`/deliveries` (behind SSO like every other page) and `/deliveries.json`:

- the most recent N rows: received_at, repo, event, action, relay_status,
  relay_error
- counts by repo × event over a selectable window (default 24 h)

## Acceptance criteria

- [ ] The page and its JSON list recent rows and per-repo × event counts for a window
- [ ] A failed relay's error is visible on the page
- [ ] The RFC's Rollout section names the comparison query against each ringo hook's `/deliveries`
