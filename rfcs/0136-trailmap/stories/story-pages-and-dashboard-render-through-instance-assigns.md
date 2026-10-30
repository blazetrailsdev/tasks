---
title: "story-pages and dashboard set instance assigns and derive rows in helpers"
status: draft
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: ["actionview"]
deps: ["rfc-pages-render-through-instance-assigns"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Bullet 2 of `render-trailmap-pages-through-helpers-assigns-and-route-helpers`, for `story-pages` (453 lines) and `dashboard` (37 lines).

This also removes the non-literal `action` in `StoryPagesController#renderPage`, once `tsc-views-strict-mode-misses-instance-assigns` lands.

## Acceptance criteria

- No `render({ locals })` remains in `story-pages` or `dashboard`.
- `BacklogRow` derivations live in `app/helpers/*` or on the models.
- `pnpm gate:snapshot` and the page tests pass with no assertion changes.
