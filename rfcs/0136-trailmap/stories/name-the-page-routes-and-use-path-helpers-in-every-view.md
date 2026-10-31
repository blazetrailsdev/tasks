---
title: "Name trailmap's page routes and call path helpers in every view"
status: done
updated: 2026-10-31
rfc: "0136-trailmap"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["re-vendor-trails-for-app-helpers"]
deps-rfc: []
est-loc: 300
priority: null
pr: trailmap#102
claim: "2026-10-30T23:02:36Z"
assignee: "deploy-ringo-pane-send-and-sessions-status"
blocked-by: null
closed-reason: null
---

## Context

Item 3 (hard-coded URLs) of the numbered list in the Context of `render-trailmap-pages-through-helpers-assigns-and-route-helpers`. Measured 2026-10-30: 40 GET routes to name, 61 hard-coded app URLs across 23 files under `app/views`, 16 in controllers. Each URL is a removed and an added line.

## Acceptance criteria

- Every page route in `config/routes.ts` has an `as:` name, in the twin as well.
- No view or controller builds an app URL by string concatenation.
- The page tests pass with no assertion changes.
