---
title: "Ringo-drawn pages stay on Loading under the development server"
status: draft
updated: 2026-10-22
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

Found while shooting screenshots for trailmap#76. Booted with `trails server` in development mode (no NODE_ENV), with TASKS_DATABASE, STATS_DB and HUB_DATABASE_URL set. `/graphs/parity` returned 200, but the page stayed on "Loading…": the server log shows `ActionController::RoutingError (No route matches [GET] "/assets/javascripts/parity-draw.js")` and the same for `/assets/stylesheets/parity.css`. `/graphs/parity/data` served the JSON correctly. With `scripts/build-assets.sh` run, NODE_ENV=production and SECRET_KEY_BASE set, the page links `/assets/ringo-parity-<hash>.js` and draws. So the development path emits a fixed, unstamped asset URL that nothing serves; production is fine.

`rfcs-draw.js` and `backlog-draw.js` are likely affected the same way: both pages render server-side, so the failure is less visible there.

Before fixing anything, decide where it lives. If `javascriptPath` / `stylesheetLinkTag` in development fall back to `/assets/javascripts/<name>.js` instead of routing through the mounted Vite dev server, that's a trails bug (actionview asset helpers + the trailties Vite mount): file it there with path:LINE and fix it there. If it's trailmap's vite.config.ts inputs or naming, fix it here.

## Acceptance criteria

- [ ] under `pnpm dev`, `/graphs/parity` draws its charts, and the server logs no RoutingError for an asset
- [ ] the cause is placed in trails or in trailmap; a trails cause is filed and fixed there, with no workaround here
- [ ] a test fails if a page's ringo asset URL 404s in development
