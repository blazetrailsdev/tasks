---
title: "story-pages and dashboard set instance assigns and derive rows in helpers"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: ["actionview"]
deps: ["rfc-pages-render-through-instance-assigns", "tsc-views-strict-mode-misses-instance-assigns"]
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

Item 2 (instance assigns) of the numbered list in the Context of `render-trailmap-pages-through-helpers-assigns-and-route-helpers`, for `story-pages` (453 lines) and `dashboard` (37 lines).

Resolving `renderPage`'s `action` before `tsc-views-strict-mode-misses-instance-assigns` lands breaks the typecheck, so that story is a dep.

## Acceptance criteria

- No `render({ locals })` remains in `story-pages` or `dashboard`.
- `BacklogRow` derivations live in `app/helpers/*` or on the models.
- `StoryPagesController#renderPage` no longer passes a non-literal `action`.
- The dashboard script uses the asset tag helper if trails ports `javascript_include_tag`; otherwise the gap is noted against `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
- `pnpm gate:snapshot` and the page tests pass with no assertion changes.
