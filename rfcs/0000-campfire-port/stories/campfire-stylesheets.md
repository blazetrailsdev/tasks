---
title: "Campfire example: stylesheets and static assets"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, vite-trails]
deps: [vendor-campfire-source]
deps-rfc: []
est-loc: 3400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app) and § The LOC ceiling is lifted.
`app/assets/stylesheets/` is 3,378 lines, including `actiontext.css`, which
maps Lexxy's CSS variables to Campfire's palette. Bookshelf copies
`app/assets` flat to `/assets` with `pnpm build:assets`. 37signals' marks and
icons are left out, as Bookshelf leaves out Writebook's.

## Acceptance criteria

- [ ] stylesheets and images copied byte for byte, less 37signals' marks
- [ ] `pnpm build:assets` serves them at the paths the views reference
