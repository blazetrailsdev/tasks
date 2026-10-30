---
title: "rfc-pages sets instance assigns and derives its rows in helpers"
status: draft
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: ["actionview"]
deps: ["re-vendor-trails-for-app-helpers"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Item 2 (instance assigns) of the numbered list in the Context of `render-trailmap-pages-through-helpers-assigns-and-route-helpers`, for `rfc-pages`. `RfcRow` and `RfcStoryRow` move out of a 316-line controller, so each moved line counts twice.

## Acceptance criteria

- No `render({ locals })` remains in `rfc-pages`; actions set fields and render implicitly.
- Row derivations live in `app/helpers/*` or on the models.
- `pnpm gate:snapshot` and the page tests pass with no assertion changes.
